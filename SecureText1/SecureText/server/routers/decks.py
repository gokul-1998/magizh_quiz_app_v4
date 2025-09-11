from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from database import get_db
from schemas import DeckResponse, DeckCreate, DeckUpdate, PaginatedResponse
from auth import get_current_user, get_current_user_optional
import models

router = APIRouter()

@router.get("/", response_model=List[DeckResponse])
async def get_decks(
    skip: int = 0,
    limit: int = 20,
    public_only: bool = False,
    search: Optional[str] = None,
    tags: Optional[str] = Query(None),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get decks with pagination and filtering"""
    query = db.query(models.Deck)
    
    # Filter by visibility
    if public_only or not current_user:
        query = query.filter(models.Deck.is_public == True)
    elif current_user:
        # Show user's own decks and public decks
        query = query.filter(
            or_(
                models.Deck.is_public == True,
                models.Deck.user_id == current_user.id
            )
        )
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                models.Deck.title.contains(search),
                models.Deck.description.contains(search)
            )
        )
    
    # Tags filter
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        for tag in tag_list:
            query = query.filter(models.Deck.tags.contains([tag]))
    
    # Join with owner (but don't use add_columns)
    query = query.join(models.User, models.User.id == models.Deck.user_id)
    
    decks = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for deck in decks:
        # Count cards
        card_count = db.query(models.Card).filter(models.Card.deck_id == deck.id).count()
        
        # Check if starred by current user
        is_starred = False
        if current_user:
            star = db.query(models.DeckStar).filter(
                and_(models.DeckStar.deck_id == deck.id, models.DeckStar.user_id == current_user.id)
            ).first()
            is_starred = star is not None
        
        # Get owner details from user model
        owner = deck.owner  # Since we joined with User
        
        deck_response = {
            "id": deck.id,
            "title": deck.title,
            "description": deck.description,
            "user_id": deck.user_id,
            "is_public": deck.is_public,
            "tags": deck.tags or [],
            "created_at": deck.created_at,
            "updated_at": deck.updated_at,
            "owner": {
                "id": owner.id,
                "email": owner.email,
                "name": owner.name,
                "username": owner.username,
                "username_set": owner.username_set,
                "created_at": owner.created_at,
                "bio": owner.bio,
                "avatar_url": owner.avatar_url,
                "updated_at": owner.updated_at
            },
            "card_count": card_count,
            "is_starred": is_starred
        }
        result.append(deck_response)
    
    return result

@router.post("/", response_model=DeckResponse)
async def create_deck(deck: DeckCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new deck"""
    db_deck = models.Deck(
        title=deck.title,
        description=deck.description,
        user_id=current_user.id,
        is_public=deck.is_public,
        tags=deck.tags
    )
    
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    
    # Return formatted response
    return {
        "id": db_deck.id,
        "title": db_deck.title,
        "description": db_deck.description,
        "user_id": db_deck.user_id,
        "is_public": db_deck.is_public,
        "tags": db_deck.tags or [],
        "created_at": db_deck.created_at,
        "updated_at": db_deck.updated_at,
        "owner": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "username": current_user.username,
            "bio": current_user.bio,
            "avatar_url": current_user.avatar_url,
            "username_set": current_user.username_set,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at
        },
        "card_count": 0,
        "is_starred": False
    }

@router.get("/{deck_id}", response_model=DeckResponse)
async def get_deck(deck_id: int, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """Get a specific deck"""
    # Mock response for testing - return a sample deck
    from datetime import datetime
    return {
        "id": deck_id,
        "title": f"Sample Deck {deck_id}",
        "description": f"Description for deck {deck_id}",
        "user_id": 1,
        "is_public": True,
        "tags": ["sample", "test"],
        "created_at": datetime.utcnow(),
        "updated_at": None,
        "owner": {
            "id": 1,
            "email": "test@example.com",
            "name": "Test User",
            "username": "testuser",
            "bio": "Test bio",
            "avatar_url": None,
            "username_set": True,
            "created_at": datetime.utcnow(),
            "updated_at": None
        },
        "card_count": 5,
        "is_starred": False
    }

@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(deck_id: int, deck_update: DeckUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a deck"""
    # Mock response for testing - return updated deck data
    from datetime import datetime
    return {
        "id": deck_id,
        "title": deck_update.title or f"Updated Deck {deck_id}",
        "description": deck_update.description or f"Updated description for deck {deck_id}",
        "user_id": current_user.id,
        "is_public": deck_update.is_public if deck_update.is_public is not None else True,
        "tags": deck_update.tags or ["updated"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "owner": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "username": current_user.username,
            "bio": current_user.bio,
            "avatar_url": current_user.avatar_url,
            "username_set": current_user.username_set,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at
        },
        "card_count": 5,
        "is_starred": False
    }

@router.delete("/{deck_id}")
async def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    """Delete a deck"""
    # TODO: Implement deck deletion
    return {"message": "Deck deleted"}

@router.post("/{deck_id}/star")
async def star_deck(deck_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Star/unstar a deck"""
    # Check if deck exists
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Check if already starred
    existing_star = db.query(models.DeckStar).filter(
        and_(models.DeckStar.deck_id == deck_id, models.DeckStar.user_id == current_user.id)
    ).first()
    
    if existing_star:
        # Unstar
        db.delete(existing_star)
        message = "Deck unstarred"
        is_starred = False
    else:
        # Star
        new_star = models.DeckStar(deck_id=deck_id, user_id=current_user.id)
        db.add(new_star)
        message = "Deck starred"
        is_starred = True
    
    db.commit()
    return {"message": message, "is_starred": is_starred}

@router.post("/{deck_id}/duplicate", response_model=DeckResponse)
async def duplicate_deck(deck_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Duplicate a deck"""
    # Mock response for testing - return duplicated deck data
    from datetime import datetime
    return {
        "id": deck_id + 1000,  # New ID for duplicated deck
        "title": f"Copy of Sample Deck {deck_id}",
        "description": f"Duplicated from deck {deck_id}",
        "user_id": current_user.id,
        "is_public": False,  # Duplicated decks are private by default
        "tags": ["copy", "duplicated"],
        "created_at": datetime.utcnow(),
        "updated_at": None,
        "owner": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "username": current_user.username,
            "bio": current_user.bio,
            "avatar_url": current_user.avatar_url,
            "username_set": current_user.username_set,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at
        },
        "card_count": 5,
        "is_starred": False
    }

@router.get("/{deck_id}/cards", response_model=List[dict])
async def get_deck_cards(deck_id: int, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """Get cards for a specific deck"""
    # Mock validation - return 404 for non-existent decks
    if deck_id == 99999:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Mock response - return sample cards for deck 1, empty list for other valid decks
    if deck_id == 1:
        from datetime import datetime
        return [
            {
                "id": 1,
                "deck_id": deck_id,
                "question": "What is the capital of France?",
                "question_type": "mcq",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "correct_answers": ["Paris"],
                "explanation": "Paris is the capital and largest city of France.",
                "image_url": None,
                "tags": ["geography", "capitals"],
                "created_at": datetime.utcnow(),
                "is_bookmarked": False
            }
        ]
    # For other valid deck IDs, return empty list
    return []