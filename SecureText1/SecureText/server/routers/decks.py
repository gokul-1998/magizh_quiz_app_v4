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
    
    # Join with owner
    query = query.join(models.User).add_columns(
        models.User.id.label("owner_id"),
        models.User.name.label("owner_name"),
        models.User.username.label("owner_username"),
        models.User.email.label("owner_email"),
        models.User.created_at.label("owner_created_at")
    )
    
    decks = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for deck_data in decks:
        deck = deck_data[0]  # The Deck object
        
        # Count cards
        card_count = db.query(models.Card).filter(models.Card.deck_id == deck.id).count()
        
        # Check if starred by current user
        is_starred = False
        if current_user:
            star = db.query(models.DeckStar).filter(
                and_(models.DeckStar.deck_id == deck.id, models.DeckStar.user_id == current_user.id)
            ).first()
            is_starred = star is not None
        
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
                "id": deck_data.owner_id,
                "email": deck_data.owner_email,
                "name": deck_data.owner_name,
                "username": deck_data.owner_username,
                "username_set": deck_data.owner_username is not None,
                "created_at": deck_data.owner_created_at
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
async def get_deck(deck_id: int, db: Session = Depends(get_db)):
    """Get a specific deck"""
    # TODO: Implement deck retrieval
    return {}

@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(deck_id: int, deck_update: DeckUpdate, db: Session = Depends(get_db)):
    """Update a deck"""
    # TODO: Implement deck update
    return {}

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
async def duplicate_deck(deck_id: int, db: Session = Depends(get_db)):
    """Duplicate a deck"""
    # TODO: Implement deck duplication
    return {}