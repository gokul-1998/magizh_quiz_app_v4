from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import csv
import json
import io
from database import get_db
from schemas import DeckResponse, CardResponse, MessageResponse
from auth import get_current_user
import models

router = APIRouter()

@router.post("/csv", response_model=MessageResponse)
async def import_cards_from_csv(
    deck_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import cards from CSV file"""
    # Verify deck ownership
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found or access denied")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV content
        content = await file.read()
        csv_data = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        cards_created = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 for header
            try:
                # Validate required fields
                if not row.get('question') or not row.get('correct_answers'):
                    errors.append(f"Row {row_num}: Missing required fields")
                    continue
                
                # Parse question type
                question_type = row.get('question_type', 'mcq').lower()
                if question_type not in ['mcq', 'multi_select', 'fill_blank']:
                    question_type = 'mcq'
                
                # Parse options
                options = []
                if row.get('options'):
                    options = [opt.strip() for opt in row['options'].split(',')]
                
                # Parse correct answers
                correct_answers = [ans.strip() for ans in row['correct_answers'].split(',')]
                
                # Parse tags
                tags = []
                if row.get('tags'):
                    tags = [tag.strip() for tag in row['tags'].split(',')]
                
                # Create card
                card = models.Card(
                    deck_id=deck_id,
                    question=row['question'].strip(),
                    question_type=getattr(models.QuestionType, question_type.upper()),
                    options=options,
                    correct_answers=correct_answers,
                    explanation=row.get('explanation', '').strip() or None,
                    tags=tags
                )
                
                db.add(card)
                cards_created += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        db.commit()
        
        message = f"Successfully imported {cards_created} cards"
        if errors:
            message += f". {len(errors)} errors occurred"
        
        return {"message": message}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@router.get("/deck/{deck_id}", response_model=dict)
async def export_deck(
    deck_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export deck as JSON"""
    # Check deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all cards for this deck
    cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
    
    # Format export data
    export_data = {
        "deck": {
            "title": deck.title,
            "description": deck.description,
            "tags": deck.tags or [],
            "is_public": deck.is_public,
            "created_at": deck.created_at.isoformat(),
            "card_count": len(cards)
        },
        "cards": [
            {
                "question": card.question,
                "question_type": card.question_type.value,
                "options": card.options or [],
                "correct_answers": card.correct_answers,
                "explanation": card.explanation,
                "tags": card.tags or []
            }
            for card in cards
        ],
        "export_info": {
            "exported_at": models.datetime.utcnow().isoformat(),
            "exported_by": current_user.username,
            "format_version": "1.0"
        }
    }
    
    return export_data

@router.post("/deck", response_model=DeckResponse)
async def import_deck(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import deck from JSON file"""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be JSON")
    
    try:
        content = await file.read()
        import_data = json.loads(content.decode('utf-8'))
        
        # Validate structure
        if 'deck' not in import_data or 'cards' not in import_data:
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        deck_data = import_data['deck']
        cards_data = import_data['cards']
        
        # Create deck
        new_deck = models.Deck(
            title=f"{deck_data['title']} (Imported)",
            description=deck_data.get('description'),
            user_id=current_user.id,
            is_public=False,  # Import as private by default
            tags=deck_data.get('tags', [])
        )
        
        db.add(new_deck)
        db.commit()
        db.refresh(new_deck)
        
        # Create cards
        cards_created = 0
        for card_data in cards_data:
            try:
                card = models.Card(
                    deck_id=new_deck.id,
                    question=card_data['question'],
                    question_type=getattr(models.QuestionType, card_data['question_type'].upper()),
                    options=card_data.get('options', []),
                    correct_answers=card_data['correct_answers'],
                    explanation=card_data.get('explanation'),
                    tags=card_data.get('tags', [])
                )
                db.add(card)
                cards_created += 1
            except Exception as e:
                continue  # Skip invalid cards
        
        db.commit()
        
        # Log activity
        activity = models.ActivityLog(
            user_id=current_user.id,
            action_type=models.ActionType.CREATE_DECK,
            resource_type="deck",
            resource_id=new_deck.id,
            extra_data={"imported": True, "cards_count": cards_created}
        )
        db.add(activity)
        db.commit()
        
        return DeckResponse.from_orm(new_deck)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import error: {str(e)}")

@router.get("/template/csv")
async def download_csv_template():
    """Download CSV template for card import"""
    template_data = [
        {
            "question": "What is the capital of France?",
            "question_type": "mcq",
            "options": "Paris,London,Berlin,Madrid",
            "correct_answers": "Paris",
            "explanation": "Paris is the capital and most populous city of France.",
            "tags": "geography,capitals"
        },
        {
            "question": "Which of these are programming languages?",
            "question_type": "multi_select", 
            "options": "Python,JavaScript,HTML,SQL",
            "correct_answers": "Python,JavaScript",
            "explanation": "Python and JavaScript are programming languages, while HTML is markup and SQL is query language.",
            "tags": "programming,languages"
        }
    ]
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=template_data[0].keys())
    writer.writeheader()
    writer.writerows(template_data)
    
    return JSONResponse(
        content={"csv_content": output.getvalue()},
        headers={"Content-Disposition": "attachment; filename=card_import_template.csv"}
    )