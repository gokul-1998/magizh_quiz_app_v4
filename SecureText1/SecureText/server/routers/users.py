from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import UserResponse, DeckResponse, ProgressResponse, StreakResponse
import models

router = APIRouter()

@router.get("/discover", response_model=List[UserResponse])
async def get_users_for_discovery(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get users for discovery page"""
    query = db.query(models.User).filter(models.User.username_set == True)
    
    if search:
        query = query.filter(
            models.User.username.contains(search) | 
            models.User.name.contains(search)
        )
    
    users = query.offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Count user's public decks
        total_decks = db.query(models.Deck).filter(
            models.Deck.user_id == user.id,
            models.Deck.is_public == True
        ).count()
        
        # Count total stars received on user's decks
        total_stars = db.query(models.DeckStar).join(models.Deck).filter(
            models.Deck.user_id == user.id
        ).count()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "username": user.username,
            "username_set": user.username_set,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "total_decks": total_decks,
            "total_stars": total_stars,
            "current_streak": 0  # TODO: Implement streak calculation
        })
    
    return result

@router.get("/profile/{username}", response_model=UserResponse)
async def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Get user profile by username"""
    print(f"DEBUG - Looking for username: {username}")
    user = db.query(models.User).filter(models.User.username == username).first()
    print(f"DEBUG - Found user: {user}")
    if user:
        print(f"DEBUG - User details: id={user.id}, username={user.username}, email={user.email}")
    if not user:
        # Debug: Show all users in database
        all_users = db.query(models.User).all()
        print(f"DEBUG - All users in database: {[(u.id, u.username, u.email) for u in all_users]}")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count user's public decks
    total_decks = db.query(models.Deck).filter(
        models.Deck.user_id == user.id,
        models.Deck.is_public == True
    ).count()
    
    # Count total stars received on user's decks
    total_stars = db.query(models.DeckStar).join(models.Deck).filter(
        models.Deck.user_id == user.id
    ).count()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "username": user.username,
        "username_set": user.username_set,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "total_decks": total_decks,
        "total_stars": total_stars,
        "current_streak": 0  # TODO: Implement streak calculation
    }

@router.get("/profile/{username}/decks", response_model=List[DeckResponse])
async def get_user_decks(
    username: str,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user's public decks"""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.query(models.Deck).filter(
        models.Deck.user_id == user.id,
        models.Deck.is_public == True
    )
    
    if search:
        query = query.filter(models.Deck.title.contains(search))
    
    decks = query.offset(skip).limit(limit).all()
    
    result = []
    for deck in decks:
        card_count = db.query(models.Card).filter(models.Card.deck_id == deck.id).count()
        star_count = db.query(models.DeckStar).filter(models.DeckStar.deck_id == deck.id).count()
        
        result.append({
            "id": deck.id,
            "title": deck.title,
            "description": deck.description,
            "is_public": deck.is_public,
            "tags": deck.tags or [],
            "created_at": deck.created_at,
            "updated_at": deck.updated_at,
            "card_count": card_count,
            "star_count": star_count,
            "owner": {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "avatar_url": user.avatar_url
            }
        })
    
    return result

@router.get("/profile/{username}/stars", response_model=List[DeckResponse])
async def get_user_starred_decks(
    username: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get user's starred decks"""
    # TODO: Implement starred deck listing
    return []

@router.get("/{username}/activity")
async def get_user_activity(
    username: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get user's activity feed"""
    # TODO: Implement activity feed
    return []

@router.get("/{username}/achievements")
async def get_user_achievements(username: str, db: Session = Depends(get_db)):
    """Get user's achievements and badges"""
    # TODO: Implement achievements
    return []

@router.get("/progress", response_model=List[ProgressResponse])
async def get_user_progress(db: Session = Depends(get_db)):
    """Get current user's progress across all decks"""
    # TODO: Implement progress tracking
    return []

@router.get("/streak", response_model=StreakResponse)
async def get_user_streak(db: Session = Depends(get_db)):
    """Get current user's streak information"""
    # TODO: Implement streak tracking
    return {}