from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from datetime import datetime, timedelta, date
from database import get_db
from schemas import DashboardStats, DeckStats
from auth import get_current_user
import models

router = APIRouter()

@router.get("/stats/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user dashboard statistics"""
    # Get total decks created by user
    total_decks = db.query(models.Deck).filter(models.Deck.user_id == current_user.id).count()
    
    # Get total cards studied (unique cards from quiz sessions)
    cards_studied = db.query(models.Card.id).join(
        models.QuizSession, models.Card.deck_id == models.QuizSession.deck_id
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).distinct().count()
    
    # Get current streak
    streak = db.query(models.Streak).filter(models.Streak.user_id == current_user.id).first()
    current_streak = streak.current_streak if streak else 0
    
    # Get total quiz sessions
    total_quiz_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    # Get average score
    avg_score = db.query(func.avg(models.QuizSession.score)).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.score.isnot(None)
    ).scalar() or 0.0
    
    # Get weekly activity (last 7 days)
    weekly_activity = []
    today = date.today()
    for i in range(7):
        day = today - timedelta(days=i)
        activity_count = db.query(models.QuizSession).filter(
            models.QuizSession.user_id == current_user.id,
            models.QuizSession.completed_at.isnot(None),
            func.date(models.QuizSession.completed_at) == day
        ).count()
        weekly_activity.insert(0, activity_count)  # Insert at beginning to maintain order
    
    return DashboardStats(
        total_decks=total_decks,
        total_cards_studied=cards_studied,
        current_streak=current_streak,
        total_quiz_sessions=total_quiz_sessions,
        average_score=round(avg_score, 2),
        weekly_activity=weekly_activity
    )

@router.get("/stats/deck/{deck_id}", response_model=DeckStats)
async def get_deck_stats(deck_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get deck performance analytics"""
    # Check if deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Check if deck is public or owned by current user
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get total attempts for this deck by current user
    total_attempts = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    # Get average score for this deck
    avg_score = db.query(func.avg(models.QuizSession.score)).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.score.isnot(None)
    ).scalar() or 0.0
    
    # Get completion rate
    total_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id
    ).count()
    
    completed_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0.0
    
    # Get difficulty breakdown from quiz answers
    difficulty_breakdown = {"easy": 0, "medium": 0, "hard": 0}
    
    difficulty_counts = db.query(
        models.QuizAnswer.difficulty_rating,
        func.count(models.QuizAnswer.id)
    ).join(
        models.QuizSession
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id,
        models.QuizAnswer.difficulty_rating.isnot(None)
    ).group_by(
        models.QuizAnswer.difficulty_rating
    ).all()
    
    for difficulty, count in difficulty_counts:
        if difficulty:
            difficulty_breakdown[difficulty.value] = count
    
    # Get recent scores (last 10 sessions)
    recent_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.score.isnot(None)
    ).order_by(
        models.QuizSession.completed_at.desc()
    ).limit(10).all()
    
    recent_scores = [session.score for session in recent_sessions]
    
    return DeckStats(
        total_attempts=total_attempts,
        average_score=round(avg_score, 2),
        completion_rate=round(completion_rate, 2),
        difficulty_breakdown=difficulty_breakdown,
        recent_scores=recent_scores
    )

@router.get("/analytics/heatmap")
async def get_activity_heatmap(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get GitHub-style activity heatmap data"""
    # Get activity data for the last year
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    
    activity_data = db.query(
        func.date(models.QuizSession.completed_at).label('date'),
        func.count(models.QuizSession.id).label('count')
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.completed_at >= one_year_ago
    ).group_by(
        func.date(models.QuizSession.completed_at)
    ).all()
    
    # Format data for heatmap
    heatmap_data = [
        {
            "date": str(activity.date),
            "count": activity.count,
            "level": min(activity.count, 4)  # GitHub-style levels 0-4
        }
        for activity in activity_data
    ]
    
    return {"data": heatmap_data}

@router.get("/analytics/performance")
async def get_performance_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed performance metrics"""
    # Get monthly performance trend
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    
    monthly_performance = db.query(
        extract('year', models.QuizSession.completed_at).label('year'),
        extract('month', models.QuizSession.completed_at).label('month'),
        func.count(models.QuizSession.id).label('sessions'),
        func.avg(models.QuizSession.score).label('avg_score')
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.completed_at >= six_months_ago
    ).group_by(
        extract('year', models.QuizSession.completed_at),
        extract('month', models.QuizSession.completed_at)
    ).order_by(
        extract('year', models.QuizSession.completed_at),
        extract('month', models.QuizSession.completed_at)
    ).all()
    
    # Get question type performance
    question_type_performance = db.query(
        models.Card.question_type,
        func.count(models.QuizAnswer.id).label('total_answers'),
        func.avg(models.QuizAnswer.is_correct.cast(models.Integer)).label('accuracy')
    ).join(
        models.QuizSession, models.QuizSession.id == models.QuizAnswer.session_id
    ).join(
        models.Card, models.Card.id == models.QuizAnswer.card_id
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).group_by(
        models.Card.question_type
    ).all()
    
    # Get best performing decks
    best_decks = db.query(
        models.Deck.title,
        func.count(models.QuizSession.id).label('sessions'),
        func.avg(models.QuizSession.score).label('avg_score')
    ).join(
        models.QuizSession, models.QuizSession.deck_id == models.Deck.id
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.score.isnot(None)
    ).group_by(
        models.Deck.id,
        models.Deck.title
    ).order_by(
        func.avg(models.QuizSession.score).desc()
    ).limit(5).all()
    
    metrics = {
        "monthly_performance": [
            {
                "year": int(mp.year),
                "month": int(mp.month),
                "sessions": mp.sessions,
                "avg_score": round(float(mp.avg_score or 0), 2)
            }
            for mp in monthly_performance
        ],
        "question_type_performance": [
            {
                "type": qt.question_type.value,
                "total_answers": qt.total_answers,
                "accuracy": round(float(qt.accuracy or 0) * 100, 2)
            }
            for qt in question_type_performance
        ],
        "best_decks": [
            {
                "title": deck.title,
                "sessions": deck.sessions,
                "avg_score": round(float(deck.avg_score or 0), 2)
            }
            for deck in best_decks
        ]
    }
    
    return {"metrics": metrics}

@router.get("/leaderboards")
async def get_leaderboards(period: str = "weekly", db: Session = Depends(get_db)):
    """Get leaderboards (daily/weekly)"""
    if period not in ["daily", "weekly"]:
        raise HTTPException(status_code=400, detail="Period must be 'daily' or 'weekly'")
    
    # Calculate date range based on period
    if period == "daily":
        start_date = datetime.utcnow().date()
    else:  # weekly
        start_date = datetime.utcnow().date() - timedelta(days=7)
    
    # Get leaderboard data
    leaderboard_data = db.query(
        models.User.username,
        models.User.name,
        func.count(models.QuizSession.id).label('sessions'),
        func.avg(models.QuizSession.score).label('avg_score'),
        func.sum(models.QuizSession.score).label('total_score')
    ).join(
        models.QuizSession, models.QuizSession.user_id == models.User.id
    ).filter(
        models.QuizSession.completed_at.isnot(None),
        models.QuizSession.completed_at >= start_date,
        models.QuizSession.score.isnot(None)
    ).group_by(
        models.User.id,
        models.User.username,
        models.User.name
    ).order_by(
        func.sum(models.QuizSession.score).desc()
    ).limit(10).all()
    
    leaderboard = [
        {
            "rank": idx + 1,
            "username": user.username,
            "name": user.name,
            "sessions": user.sessions,
            "avg_score": round(float(user.avg_score or 0), 2),
            "total_score": round(float(user.total_score or 0), 2)
        }
        for idx, user in enumerate(leaderboard_data)
    ]
    
    return {"leaderboard": leaderboard}

@router.get("/recommendations")
async def get_deck_recommendations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get personalized deck recommendations"""
    # Get user's studied categories and tags
    user_tags = db.query(
        func.json_array_elements_text(models.Card.tags).label('tag'),
        func.count(func.json_array_elements_text(models.Card.tags)).label('count')
    ).join(
        models.QuizSession, models.QuizSession.deck_id == models.Card.deck_id
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).group_by(
        func.json_array_elements_text(models.Card.tags)
    ).order_by(
        func.count(func.json_array_elements_text(models.Card.tags)).desc()
    ).limit(5).all()
    
    user_tags_list = [tag.tag for tag in user_tags]
    
    # Get decks with similar tags that user hasn't studied yet
    recommended_decks = db.query(models.Deck).filter(
        models.Deck.is_public == True,
        models.Deck.user_id != current_user.id,  # Not user's own decks
        ~models.Deck.id.in_(
            db.query(models.QuizSession.deck_id).filter(
                models.QuizSession.user_id == current_user.id
            )
        )
    ).all()
    
    # Score decks based on tag similarity
    scored_decks = []
    for deck in recommended_decks:
        deck_tags = deck.tags or []
        tag_score = len(set(deck_tags) & set(user_tags_list))
        
        # Also consider deck popularity (number of quiz sessions by other users)
        popularity = db.query(models.QuizSession).filter(
            models.QuizSession.deck_id == deck.id,
            models.QuizSession.user_id != current_user.id
        ).count()
        
        if tag_score > 0 or popularity > 0:  # Only include decks with some relevance
            scored_decks.append({
                "deck": deck,
                "score": tag_score * 2 + min(popularity, 10),  # Weight tags more heavily
                "popularity": popularity
            })
    
    # Sort by score and return top recommendations
    scored_decks.sort(key=lambda x: x['score'], reverse=True)
    top_recommendations = scored_decks[:10]
    
    recommendations = [
        {
            "deck_id": item['deck'].id,
            "title": item['deck'].title,
            "description": item['deck'].description,
            "tags": item['deck'].tags,
            "card_count": len(item['deck'].cards),
            "popularity": item['popularity'],
            "relevance_score": item['score']
        }
        for item in top_recommendations
    ]
    
    return {"recommendations": recommendations}