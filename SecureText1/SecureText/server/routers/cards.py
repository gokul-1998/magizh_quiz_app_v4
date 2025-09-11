from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from database import get_db
from schemas import CardResponse, CardCreate, CardUpdate, MessageResponse
from auth import get_current_user
import models

router = APIRouter()

@router.get("/", response_model=List[CardResponse])
async def get_cards(
    deck_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cards for a deck"""
    query = db.query(models.Card)
    
    if deck_id:
        # Check if deck exists and user has access
        deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        
        # Check if deck is public or owned by current user
        if not deck.is_public and deck.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        query = query.filter(models.Card.deck_id == deck_id)
    
    # Get cards with bookmark status for current user
    cards = query.offset(skip).limit(limit).all()
    
    # Add bookmark status for each card
    result = []
    for card in cards:
        is_bookmarked = db.query(models.CardBookmark).filter(
            and_(
                models.CardBookmark.user_id == current_user.id,
                models.CardBookmark.card_id == card.id
            )
        ).first() is not None
        
        card_response = CardResponse.from_orm(card)
        card_response.is_bookmarked = is_bookmarked
        result.append(card_response)
    
    return result

@router.post("/", response_model=CardResponse)
async def create_card(card: CardCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new card"""
    # Check if deck exists and is owned by current user
    deck = db.query(models.Deck).filter(models.Deck.id == card.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create new card
    db_card = models.Card(
        deck_id=card.deck_id,
        question=card.question,
        question_type=models.QuestionType(card.question_type.value),
        options=card.options,
        correct_answers=card.correct_answers,
        explanation=card.explanation,
        image_url=card.image_url,
        tags=card.tags
    )
    
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    
    # Create response with bookmark status (new cards are not bookmarked)
    card_response = CardResponse.from_orm(db_card)
    card_response.is_bookmarked = False
    
    return card_response

@router.get("/{card_id}", response_model=CardResponse)
async def get_card(card_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific card"""
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if deck is public or owned by current user
    deck = card.deck
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check bookmark status
    is_bookmarked = db.query(models.CardBookmark).filter(
        and_(
            models.CardBookmark.user_id == current_user.id,
            models.CardBookmark.card_id == card.id
        )
    ).first() is not None
    
    card_response = CardResponse.from_orm(card)
    card_response.is_bookmarked = is_bookmarked
    
    return card_response

@router.put("/{card_id}", response_model=CardResponse)
async def update_card(card_id: int, card_update: CardUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a card"""
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if deck is owned by current user
    deck = card.deck
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update card fields
    update_data = card_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'question_type':
            setattr(card, field, models.QuestionType(value))
        else:
            setattr(card, field, value)
    
    card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(card)
    
    # Check bookmark status
    is_bookmarked = db.query(models.CardBookmark).filter(
        and_(
            models.CardBookmark.user_id == current_user.id,
            models.CardBookmark.card_id == card.id
        )
    ).first() is not None
    
    card_response = CardResponse.from_orm(card)
    card_response.is_bookmarked = is_bookmarked
    
    return card_response

@router.delete("/{card_id}")
async def delete_card(card_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a card"""
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if deck is owned by current user
    deck = card.deck
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(card)
    db.commit()
    
    return {"message": "Card deleted"}

@router.post("/{card_id}/bookmark", response_model=dict)
async def bookmark_card(card_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Bookmark/unbookmark a card"""
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if deck is public or owned by current user
    deck = card.deck
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if already bookmarked
    existing_bookmark = db.query(models.CardBookmark).filter(
        and_(
            models.CardBookmark.user_id == current_user.id,
            models.CardBookmark.card_id == card_id
        )
    ).first()
    
    if existing_bookmark:
        # Remove bookmark
        db.delete(existing_bookmark)
        db.commit()
        return {"message": "Card unbookmarked", "is_bookmarked": False}
    else:
        # Add bookmark
        bookmark = models.CardBookmark(
            user_id=current_user.id,
            card_id=card_id
        )
        db.add(bookmark)
        db.commit()
        return {"message": "Card bookmarked", "is_bookmarked": True}

@router.get("/decks/{deck_id}/cards", response_model=List[CardResponse])
async def get_deck_cards(deck_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get cards for a specific deck"""
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Check if deck is public or owned by current user
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all cards for this deck
    cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
    
    # Add bookmark status for each card
    result = []
    for card in cards:
        is_bookmarked = db.query(models.CardBookmark).filter(
            and_(
                models.CardBookmark.user_id == current_user.id,
                models.CardBookmark.card_id == card.id
            )
        ).first() is not None
        
        card_response = CardResponse.from_orm(card)
        card_response.is_bookmarked = is_bookmarked
        result.append(card_response)
    
    return result