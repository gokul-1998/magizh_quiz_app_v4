from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models import (
    User, Streak, DailyChallenge, ActivityLog, QuizSession, 
    UserProgress, Deck, ActionType, QuizMode
)
import random

class GamificationService:
    """Service for handling gamification features like streaks, achievements, challenges"""
    
    ACHIEVEMENT_THRESHOLDS = {
        'perfect_scorer': 5,  # 5 perfect scores
        'streak_master': 30,  # 30-day streak
        'quiz_enthusiast': 100,  # 100 completed quizzes
        'deck_creator': 10,  # 10 created decks
        'knowledge_seeker': 1000,  # 1000 cards studied
    }
    
    @classmethod
    def update_streak(cls, db: Session, user_id: int, accuracy: float) -> Dict[str, Any]:
        """Update user's streak based on daily challenge completion"""
        streak = db.query(Streak).filter(Streak.user_id == user_id).first()
        
        if not streak:
            streak = Streak(user_id=user_id)
            db.add(streak)
        
        today = date.today()
        last_activity = streak.last_activity_date.date() if streak.last_activity_date else None
        
        # Check if this is a new day
        if last_activity != today:
            # Check if streak should continue (85% accuracy required)
            if accuracy >= 0.85:
                if last_activity == today - timedelta(days=1):
                    # Continue streak
                    streak.current_streak += 1
                else:
                    # Restart streak
                    streak.current_streak = 1
                
                # Update longest streak
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
            else:
                # Break streak
                streak.current_streak = 0
            
            streak.last_activity_date = datetime.utcnow()
            db.commit()
        
        return {
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'maintained': accuracy >= 0.85
        }
    
    @classmethod
    def create_daily_challenge(cls, db: Session, user_id: int) -> Optional[DailyChallenge]:
        """Create a daily challenge for the user"""
        today = date.today()
        
        # Check if challenge already exists for today
        existing = db.query(DailyChallenge).filter(
            DailyChallenge.user_id == user_id,
            func.date(DailyChallenge.date) == today
        ).first()
        
        if existing:
            return existing
        
        # Get user's public decks or popular public decks
        user_decks = db.query(Deck).filter(
            Deck.user_id == user_id,
            Deck.is_public == True
        ).all()
        
        if not user_decks:
            # Fall back to popular public decks
            user_decks = db.query(Deck).filter(
                Deck.is_public == True
            ).limit(10).all()
        
        if not user_decks:
            return None
        
        # Select random deck
        challenge_deck = random.choice(user_decks)
        
        challenge = DailyChallenge(
            user_id=user_id,
            deck_id=challenge_deck.id,
            date=datetime.utcnow()
        )
        
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        
        return challenge
    
    @classmethod
    def complete_daily_challenge(cls, db: Session, challenge_id: int, 
                                score: int, total: int) -> Dict[str, Any]:
        """Complete a daily challenge and update streak"""
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.id == challenge_id
        ).first()
        
        if not challenge or challenge.completed:
            return {'error': 'Challenge not found or already completed'}
        
        accuracy = score / total if total > 0 else 0
        
        # Update challenge
        challenge.completed = True
        challenge.score = score
        challenge.accuracy_percent = accuracy * 100
        
        # Update streak
        streak_info = cls.update_streak(db, challenge.user_id, accuracy)
        
        # Log activity
        activity = ActivityLog(
            user_id=challenge.user_id,
            action_type=ActionType.COMPLETE_CHALLENGE,
            resource_type='challenge',
            resource_id=challenge_id,
            extra_data={'score': score, 'total': total, 'accuracy': accuracy}
        )
        db.add(activity)
        
        db.commit()
        
        return {
            'challenge_completed': True,
            'score': score,
            'total': total,
            'accuracy': accuracy,
            'streak': streak_info
        }
    
    @classmethod
    def calculate_achievements(cls, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Calculate user achievements"""
        achievements = []
        
        # Perfect Scorer - X perfect quiz scores
        perfect_scores = db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.score == QuizSession.total_questions
        ).count()
        
        if perfect_scores >= cls.ACHIEVEMENT_THRESHOLDS['perfect_scorer']:
            achievements.append({
                'type': 'perfect_scorer',
                'title': 'Perfect Scorer',
                'description': f'{perfect_scores} perfect quiz scores',
                'icon': '🎯',
                'earned_at': datetime.utcnow()
            })
        
        # Streak Master - X day streak
        streak = db.query(Streak).filter(Streak.user_id == user_id).first()
        if streak and streak.longest_streak >= cls.ACHIEVEMENT_THRESHOLDS['streak_master']:
            achievements.append({
                'type': 'streak_master',
                'title': 'Streak Master',
                'description': f'{streak.longest_streak}-day learning streak',
                'icon': '🔥',
                'earned_at': datetime.utcnow()
            })
        
        # Quiz Enthusiast - X completed quizzes
        total_quizzes = db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.completed_at.isnot(None)
        ).count()
        
        if total_quizzes >= cls.ACHIEVEMENT_THRESHOLDS['quiz_enthusiast']:
            achievements.append({
                'type': 'quiz_enthusiast',
                'title': 'Quiz Enthusiast',
                'description': f'{total_quizzes} quizzes completed',
                'icon': '📚',
                'earned_at': datetime.utcnow()
            })
        
        # Deck Creator - X created decks
        created_decks = db.query(Deck).filter(Deck.user_id == user_id).count()
        if created_decks >= cls.ACHIEVEMENT_THRESHOLDS['deck_creator']:
            achievements.append({
                'type': 'deck_creator',
                'title': 'Deck Creator',
                'description': f'{created_decks} decks created',
                'icon': '🎨',
                'earned_at': datetime.utcnow()
            })
        
        return achievements
    
    @classmethod
    def get_leaderboard(cls, db: Session, period: str = 'weekly', limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard for specified period"""
        if period == 'daily':
            start_date = datetime.utcnow() - timedelta(days=1)
        elif period == 'weekly':
            start_date = datetime.utcnow() - timedelta(weeks=1)
        else:  # monthly
            start_date = datetime.utcnow() - timedelta(days=30)
        
        # Get top performers based on quiz scores
        leaderboard = db.query(
            User.id,
            User.name,
            User.username,
            User.avatar_url,
            func.count(QuizSession.id).label('quiz_count'),
            func.avg(QuizSession.score / QuizSession.total_questions * 100).label('avg_score')
        ).join(QuizSession).filter(
            QuizSession.completed_at >= start_date
        ).group_by(User.id).order_by(
            desc('avg_score')
        ).limit(limit).all()
        
        result = []
        for rank, row in enumerate(leaderboard, 1):
            result.append({
                'rank': rank,
                'user_id': row.id,
                'name': row.name,
                'username': row.username,
                'avatar_url': row.avatar_url,
                'quiz_count': row.quiz_count,
                'average_score': round(row.avg_score, 1)
            })
        
        return result
    
    @classmethod
    def get_user_stats(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        # Basic stats
        total_quizzes = db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.completed_at.isnot(None)
        ).count()
        
        avg_score = db.query(
            func.avg(QuizSession.score / QuizSession.total_questions * 100)
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.completed_at.isnot(None)
        ).scalar() or 0
        
        # Streak info
        streak = db.query(Streak).filter(Streak.user_id == user_id).first()
        
        # Recent activity
        recent_sessions = db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.completed_at.isnot(None)
        ).order_by(desc(QuizSession.completed_at)).limit(5).all()
        
        return {
            'total_quizzes': total_quizzes,
            'average_score': round(avg_score, 1),
            'current_streak': streak.current_streak if streak else 0,
            'longest_streak': streak.longest_streak if streak else 0,
            'achievements': cls.calculate_achievements(db, user_id),
            'recent_sessions': [
                {
                    'deck_id': session.deck_id,
                    'score': session.score,
                    'total': session.total_questions,
                    'accuracy': round((session.score / session.total_questions) * 100, 1),
                    'completed_at': session.completed_at
                }
                for session in recent_sessions
            ]
        }