from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from datetime import datetime, timedelta
from typing import List, Optional
from database import get_db
from schemas import UserResponse, DeckResponse, ProgressResponse, StreakResponse
from auth import get_current_user
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
        
        # Get streak information
        streak = db.query(models.Streak).filter(models.Streak.user_id == user.id).first()
        current_streak = streak.current_streak if streak else 0
        
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
            "current_streak": current_streak
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
    
    # Get streak information
    streak = db.query(models.Streak).filter(models.Streak.user_id == user.id).first()
    current_streak = streak.current_streak if streak else 0
    
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
        "current_streak": current_streak
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
            "user_id": deck.user_id,
            "is_public": deck.is_public,
            "tags": deck.tags or [],
            "created_at": deck.created_at,
            "updated_at": deck.updated_at,
            "card_count": card_count,
            "star_count": star_count,
            "is_starred": False,
            "owner": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "name": user.name,
                "username_set": user.username_set,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "bio": user.bio,
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
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get starred decks
    starred_decks = db.query(models.Deck).join(
        models.DeckStar
    ).filter(
        models.DeckStar.user_id == user.id,
        models.Deck.is_public == True
    ).offset(skip).limit(limit).all()
    
    result = []
    for deck in starred_decks:
        card_count = db.query(models.Card).filter(models.Card.deck_id == deck.id).count()
        star_count = db.query(models.DeckStar).filter(models.DeckStar.deck_id == deck.id).count()
        
        result.append({
            "id": deck.id,
            "title": deck.title,
            "description": deck.description,
            "user_id": deck.user_id,
            "is_public": deck.is_public,
            "tags": deck.tags or [],
            "created_at": deck.created_at,
            "updated_at": deck.updated_at,
            "card_count": card_count,
            "star_count": star_count,
            "is_starred": False,
            "owner": {
                "id": deck.owner.id,
                "email": deck.owner.email,
                "username": deck.owner.username,
                "name": deck.owner.name,
                "username_set": deck.owner.username_set,
                "created_at": deck.owner.created_at,
                "updated_at": deck.owner.updated_at,
                "bio": deck.owner.bio,
                "avatar_url": deck.owner.avatar_url
            }
        })
    
    return result

@router.get("/{username}/activity")
async def get_user_activity(
    username: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get user's activity feed"""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get activity feed
    activities = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == user.id
    ).order_by(
        models.ActivityLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for activity in activities:
        activity_data = {
            "id": activity.id,
            "action_type": activity.action_type.value,
            "resource_type": activity.resource_type,
            "resource_id": activity.resource_id,
            "created_at": activity.created_at,
            "extra_data": activity.extra_data or {}
        }
        
        # Add resource details based on type
        if activity.resource_type == "deck":
            deck = db.query(models.Deck).filter(models.Deck.id == activity.resource_id).first()
            if deck:
                activity_data["resource_title"] = deck.title
        elif activity.resource_type == "card":
            card = db.query(models.Card).filter(models.Card.id == activity.resource_id).first()
            if card:
                activity_data["resource_title"] = card.question[:50] + "..." if len(card.question) > 50 else card.question
        
        result.append(activity_data)
    
    return result

@router.get("/{username}/achievements")
async def get_user_achievements(username: str, db: Session = Depends(get_db)):
    """Get user's achievements and badges"""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    achievements = []
    
    # Achievement 1: First Deck Created
    total_decks = db.query(models.Deck).filter(models.Deck.user_id == user.id).count()
    if total_decks >= 1:
        achievements.append({
            "name": "Deck Creator",
            "description": "Created your first deck",
            "icon": "🎯",
            "level": 1,
            "progress": 1,
            "max_progress": 1,
            "achieved": True,
            "achieved_at": db.query(models.Deck).filter(models.Deck.user_id == user.id).first().created_at if total_decks > 0 else None
        })
    
    # Achievement 2: Deck Master (multiple levels)
    deck_levels = [
        (5, "Deck Master", "Created 5 decks", "🎓"),
        (10, "Deck Expert", "Created 10 decks", "🏆"),
        (25, "Deck Legend", "Created 25 decks", "👑")
    ]
    for threshold, name, desc, icon in deck_levels:
        if total_decks >= threshold:
            achievements.append({
                "name": name,
                "description": desc,
                "icon": icon,
                "level": threshold // 5,
                "progress": min(total_decks, threshold),
                "max_progress": threshold,
                "achieved": True,
                "achieved_at": None  # Could be calculated from creation dates
            })
    
    # Achievement 3: Quiz Champion
    total_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == user.id,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    session_levels = [
        (10, "Quiz Beginner", "Completed 10 quizzes", "📚"),
        (50, "Quiz Enthusiast", "Completed 50 quizzes", "📖"),
        (100, "Quiz Master", "Completed 100 quizzes", "🧠")
    ]
    for threshold, name, desc, icon in session_levels:
        if total_sessions >= threshold:
            achievements.append({
                "name": name,
                "description": desc,
                "icon": icon,
                "level": threshold // 10,
                "progress": min(total_sessions, threshold),
                "max_progress": threshold,
                "achieved": True,
                "achieved_at": None
            })
    
    # Achievement 4: Perfect Score
    perfect_scores = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == user.id,
        models.QuizSession.score == 100.0,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    if perfect_scores >= 1:
        achievements.append({
            "name": "Perfect Score",
            "description": f"Achieved {perfect_scores} perfect scores",
            "icon": "💯",
            "level": min(perfect_scores, 5),
            "progress": perfect_scores,
            "max_progress": max(perfect_scores, 5),
            "achieved": True,
            "achieved_at": None
        })
    
    # Achievement 5: Streak Master
    streak = db.query(models.Streak).filter(models.Streak.user_id == user.id).first()
    current_streak = streak.current_streak if streak else 0
    
    streak_levels = [
        (7, "Week Warrior", "7-day study streak", "🔥"),
        (30, "Monthly Master", "30-day study streak", "🌟"),
        (90, "Quarterly Queen", "90-day study streak", "✨")
    ]
    for threshold, name, desc, icon in streak_levels:
        if current_streak >= threshold:
            achievements.append({
                "name": name,
                "description": desc,
                "icon": icon,
                "level": threshold // 7,
                "progress": min(current_streak, threshold),
                "max_progress": threshold,
                "achieved": True,
                "achieved_at": None
            })
    
    return achievements

@router.get("/progress", response_model=List[ProgressResponse])
async def get_user_progress(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's progress across all decks"""
    progress_data = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).all()
    
    result = []
    for progress in progress_data:
        deck = progress.deck
        
        # Get total cards in deck
        total_cards = db.query(models.Card).filter(
            models.Card.deck_id == deck.id
        ).count()
        
        # Get last attempt date
        last_attempt = db.query(models.QuizSession).filter(
            models.QuizSession.user_id == current_user.id,
            models.QuizSession.deck_id == deck.id,
            models.QuizSession.completed_at.isnot(None)
        ).order_by(
            models.QuizSession.completed_at.desc()
        ).first()
        
        result.append({
            "deck_id": deck.id,
            "total_attempts": progress.total_attempts,
            "best_score": progress.best_score,
            "last_attempt_at": last_attempt.completed_at if last_attempt else None,
            "mastery_level": progress.mastery_level,
            "deck": {
                "id": deck.id,
                "title": deck.title,
                "description": deck.description,
                "user_id": deck.user_id,
                "is_public": deck.is_public,
                "tags": deck.tags or [],
                "created_at": deck.created_at,
                "updated_at": deck.updated_at,
                "card_count": total_cards,
                "star_count": 0,
                "is_starred": False,
                "owner": {
                    "id": deck.owner.id,
                    "email": deck.owner.email,
                    "username": deck.owner.username,
                    "name": deck.owner.name,
                    "username_set": deck.owner.username_set,
                    "created_at": deck.owner.created_at,
                    "updated_at": deck.owner.updated_at,
                    "bio": deck.owner.bio,
                    "avatar_url": deck.owner.avatar_url
                }
            }
        })
    
    return result

@router.get("/streak", response_model=StreakResponse)
async def get_user_streak(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's streak information"""
    streak = db.query(models.Streak).filter(models.Streak.user_id == current_user.id).first()
    
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None
        }
    
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date
    }