from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from database import get_db
from schemas import (
    QuizSessionCreate, QuizSessionResponse, QuizAnswerSubmit, 
    MessageResponse, DashboardStats
)
from auth import get_current_user
from services.spaced_repetition import SpacedRepetitionService
from services.gamification import GamificationService
import models

router = APIRouter()

@router.post("/sessions", response_model=QuizSessionResponse)
async def start_quiz_session(
    session_data: QuizSessionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new quiz session"""
    # Verify deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == session_data.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to private deck")
    
    # Get cards for this session
    if session_data.mode == models.QuizMode.REVIEW:
        # Review mode: get cards that were answered incorrectly
        cards = db.query(models.Card).join(models.QuizAnswer).join(models.QuizSession).filter(
            models.Card.deck_id == session_data.deck_id,
            models.QuizSession.user_id == current_user.id,
            models.QuizAnswer.is_correct == False
        ).distinct().limit(20).all()
    elif session_data.mode == models.QuizMode.STUDY:
        # Study mode: use spaced repetition
        cards = SpacedRepetitionService.get_adaptive_deck_cards(
            db, current_user.id, session_data.deck_id
        )[:20]
    else:
        # Exam mode: all cards in random order
        cards = db.query(models.Card).filter(
            models.Card.deck_id == session_data.deck_id
        ).order_by(func.random()).limit(20).all()
    
    if not cards:
        raise HTTPException(status_code=400, detail="No cards available for this quiz")
    
    # Create quiz session
    quiz_session = models.QuizSession(
        user_id=current_user.id,
        deck_id=session_data.deck_id,
        mode=session_data.mode,
        total_questions=len(cards)
    )
    
    db.add(quiz_session)
    db.commit()
    db.refresh(quiz_session)
    
    return quiz_session

@router.post("/sessions/{session_id}/answers", response_model=MessageResponse)
async def submit_quiz_answer(
    session_id: int,
    answer_data: QuizAnswerSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for a quiz question"""
    # Verify session belongs to user
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz session already completed")
    
    # Get the card
    card = db.query(models.Card).filter(models.Card.id == answer_data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if answer is correct
    is_correct = set(answer_data.user_answers) == set(card.correct_answers)
    
    # Create quiz answer
    quiz_answer = models.QuizAnswer(
        session_id=session_id,
        card_id=answer_data.card_id,
        user_answers=answer_data.user_answers,
        is_correct=is_correct,
        difficulty_rating=answer_data.difficulty_rating,
        time_taken=answer_data.time_taken
    )
    
    db.add(quiz_answer)
    
    # Update spaced repetition plan if in study mode
    if session.mode == models.QuizMode.STUDY and answer_data.difficulty_rating:
        SpacedRepetitionService.update_study_plan(
            db, current_user.id, answer_data.card_id, 
            is_correct, answer_data.difficulty_rating
        )
    
    db.commit()
    
    return {"message": "Answer submitted successfully"}

@router.post("/sessions/{session_id}/complete", response_model=QuizSessionResponse)
async def complete_quiz_session(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete a quiz session and calculate score"""
    # Get session with answers
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz session already completed")
    
    # Calculate score
    correct_answers = db.query(models.QuizAnswer).filter(
        models.QuizAnswer.session_id == session_id,
        models.QuizAnswer.is_correct == True
    ).count()
    
    total_answers = db.query(models.QuizAnswer).filter(
        models.QuizAnswer.session_id == session_id
    ).count()
    
    session.score = correct_answers
    session.completed_at = datetime.utcnow()
    
    # Update user progress
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.deck_id == session.deck_id
    ).first()
    
    if not progress:
        progress = models.UserProgress(
            user_id=current_user.id,
            deck_id=session.deck_id
        )
        db.add(progress)
    
    progress.total_attempts += 1
    progress.last_attempt_at = datetime.utcnow()
    
    accuracy = correct_answers / total_answers if total_answers > 0 else 0
    if accuracy > progress.best_score:
        progress.best_score = accuracy
    
    # Update mastery level
    progress.mastery_level = min(1.0, progress.mastery_level + (accuracy * 0.1))
    
    # Log activity
    activity = models.ActivityLog(
        user_id=current_user.id,
        action_type=models.ActionType.COMPLETE_QUIZ,
        resource_type="quiz",
        resource_id=session_id,
        extra_data={
            "score": correct_answers,
            "total": total_answers,
            "accuracy": accuracy,
            "mode": session.mode.value
        }
    )
    db.add(activity)
    
    # Update daily challenge if applicable
    if session.mode == models.QuizMode.EXAM:
        today_challenge = db.query(models.DailyChallenge).filter(
            models.DailyChallenge.user_id == current_user.id,
            func.date(models.DailyChallenge.date) == datetime.utcnow().date(),
            models.DailyChallenge.deck_id == session.deck_id,
            models.DailyChallenge.completed == False
        ).first()
        
        if today_challenge:
            GamificationService.complete_daily_challenge(
                db, today_challenge.id, correct_answers, total_answers
            )
    
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the user"""
    # Total decks created
    total_decks = db.query(models.Deck).filter(models.Deck.user_id == current_user.id).count()
    
    # Total quiz sessions completed
    total_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).count()
    
    # Cards studied (unique cards answered)
    cards_studied = db.query(models.QuizAnswer.card_id).join(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id
    ).distinct().count()
    
    # Average score
    avg_score_result = db.query(
        func.avg(models.QuizSession.score / models.QuizSession.total_questions * 100)
    ).filter(
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.completed_at.isnot(None)
    ).scalar()
    
    avg_score = avg_score_result or 0.0
    
    # Current streak
    streak = db.query(models.Streak).filter(models.Streak.user_id == current_user.id).first()
    current_streak = streak.current_streak if streak else 0
    
    # Weekly activity (last 7 days)
    weekly_activity = []
    for i in range(7):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_sessions = db.query(models.QuizSession).filter(
            models.QuizSession.user_id == current_user.id,
            func.date(models.QuizSession.completed_at) == day
        ).count()
        weekly_activity.append(day_sessions)
    
    weekly_activity.reverse()  # Oldest to newest
    
    return DashboardStats(
        total_decks=total_decks,
        total_cards_studied=cards_studied,
        current_streak=current_streak,
        total_quiz_sessions=total_sessions,
        average_score=round(avg_score, 1),
        weekly_activity=weekly_activity
    )

@router.get("/sessions/{session_id}", response_model=QuizSessionResponse)
async def get_quiz_session(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific quiz session"""
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    return session

@router.get("/sessions", response_model=List[QuizSessionResponse])
async def get_user_quiz_sessions(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's quiz sessions"""
    sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id
    ).order_by(models.QuizSession.started_at.desc()).offset(skip).limit(limit).all()
    
    return sessions