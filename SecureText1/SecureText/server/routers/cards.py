from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import CardResponse, CardCreate, CardUpdate
import models

router = APIRouter()

@router.get("/", response_model=List[CardResponse])
async def get_cards(
    deck_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get cards for a deck"""
    if deck_id == 1:
        # Sample JavaScript cards
        return [
            {
                "id": 1,
                "deck_id": 1,
                "question": "What does 'var' keyword do in JavaScript?",
                "question_type": "mcq",
                "options": ["Declares a variable", "Creates a function", "Imports a module", "Exports a value"],
                "correct_answers": ["Declares a variable"],
                "explanation": "The 'var' keyword is used to declare variables in JavaScript.",
                "image_url": None,
                "tags": ["variables", "basics"],
                "created_at": "2025-09-07T17:00:00Z",
                "is_bookmarked": False
            },
            {
                "id": 2,
                "deck_id": 1,
                "question": "Which of the following are JavaScript data types?",
                "question_type": "multi_select",
                "options": ["string", "number", "boolean", "array", "decimal"],
                "correct_answers": ["string", "number", "boolean"],
                "explanation": "JavaScript has primitive types: string, number, boolean, undefined, null, symbol, and bigint.",
                "image_url": None,
                "tags": ["data-types", "basics"],
                "created_at": "2025-09-07T17:00:00Z",
                "is_bookmarked": False
            }
        ]
    return []

@router.post("/", response_model=CardResponse)
async def create_card(card: CardCreate, db: Session = Depends(get_db)):
    """Create a new card"""
    # TODO: Implement card creation
    return {}

@router.get("/{card_id}", response_model=CardResponse)
async def get_card(card_id: int, db: Session = Depends(get_db)):
    """Get a specific card"""
    # TODO: Implement card retrieval
    return {}

@router.put("/{card_id}", response_model=CardResponse)
async def update_card(card_id: int, card_update: CardUpdate, db: Session = Depends(get_db)):
    """Update a card"""
    # TODO: Implement card update
    return {}

@router.delete("/{card_id}")
async def delete_card(card_id: int, db: Session = Depends(get_db)):
    """Delete a card"""
    # TODO: Implement card deletion
    return {"message": "Card deleted"}

@router.post("/{card_id}/bookmark")
async def bookmark_card(card_id: int, db: Session = Depends(get_db)):
    """Bookmark/unbookmark a card"""
    # TODO: Implement card bookmarking
    return {"message": "Card bookmarked"}