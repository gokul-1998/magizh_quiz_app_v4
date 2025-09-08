from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import StudyPlan, QuizAnswer, Difficulty, Card, User
import random

class SpacedRepetitionService:
    """
    Implements spaced repetition algorithm for adaptive learning
    Based on SM-2 algorithm with modifications for educational content
    """
    
    # Base intervals in days for different difficulty levels
    INTERVALS = {
        Difficulty.EASY: [1, 3, 7, 14, 30, 60],
        Difficulty.MEDIUM: [1, 2, 5, 10, 21, 45], 
        Difficulty.HARD: [1, 1, 3, 6, 12, 24]
    }
    
    @classmethod
    def calculate_next_review(cls, difficulty: Difficulty, repetition_count: int, is_correct: bool) -> datetime:
        """Calculate when a card should be reviewed next"""
        intervals = cls.INTERVALS[difficulty]
        
        if not is_correct:
            # Reset to beginning if answered incorrectly
            next_interval = intervals[0]
        else:
            # Progress through the intervals
            interval_index = min(repetition_count, len(intervals) - 1)
            next_interval = intervals[interval_index]
            
            # Add some randomness to prevent clustering
            variation = random.uniform(0.8, 1.2)
            next_interval = int(next_interval * variation)
        
        return datetime.utcnow() + timedelta(days=next_interval)
    
    @classmethod
    def update_study_plan(cls, db: Session, user_id: int, card_id: int, 
                         is_correct: bool, difficulty_rating: Difficulty):
        """Update the study plan for a specific card"""
        study_plan = db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.card_id == card_id
        ).first()
        
        if not study_plan:
            # Create new study plan
            study_plan = StudyPlan(
                user_id=user_id,
                card_id=card_id,
                repetition_count=0,
                difficulty=difficulty_rating
            )
            db.add(study_plan)
        
        # Update repetition count
        if is_correct:
            study_plan.repetition_count += 1
        else:
            study_plan.repetition_count = 0
        
        # Update difficulty based on user rating
        study_plan.difficulty = difficulty_rating
        
        # Calculate next review date
        study_plan.next_review_at = cls.calculate_next_review(
            difficulty_rating, study_plan.repetition_count, is_correct
        )
        
        db.commit()
        return study_plan
    
    @classmethod
    def get_cards_for_review(cls, db: Session, user_id: int, limit: int = 20) -> List[Card]:
        """Get cards that are due for review"""
        now = datetime.utcnow()
        
        # Get cards due for review
        due_cards = db.query(Card).join(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.next_review_at <= now
        ).limit(limit).all()
        
        return due_cards
    
    @classmethod
    def get_adaptive_deck_cards(cls, db: Session, user_id: int, deck_id: int) -> List[Card]:
        """Get cards from a deck ordered by spaced repetition priority"""
        # Get all cards from the deck
        all_cards = db.query(Card).filter(Card.deck_id == deck_id).all()
        
        # Get study plans for this user
        study_plans = db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.card_id.in_([card.id for card in all_cards])
        ).all()
        
        study_plan_map = {sp.card_id: sp for sp in study_plans}
        now = datetime.utcnow()
        
        # Categorize cards
        due_cards = []
        new_cards = []
        future_cards = []
        
        for card in all_cards:
            if card.id in study_plan_map:
                study_plan = study_plan_map[card.id]
                if study_plan.next_review_at <= now:
                    due_cards.append((card, study_plan.next_review_at))
                else:
                    future_cards.append((card, study_plan.next_review_at))
            else:
                new_cards.append(card)
        
        # Sort due cards by review date (most overdue first)
        due_cards.sort(key=lambda x: x[1])
        
        # Combine in priority order: due cards, new cards, future cards
        result = [card for card, _ in due_cards]
        result.extend(new_cards)
        result.extend([card for card, _ in future_cards])
        
        return result