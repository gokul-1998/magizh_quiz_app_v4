import pytest
from datetime import datetime, timedelta
from services.spaced_repetition import SpacedRepetitionService
from models import Difficulty

def test_calculate_next_review_easy_correct():
    """Test next review calculation for easy difficulty with correct answer"""
    next_review = SpacedRepetitionService.calculate_next_review(
        Difficulty.EASY, 0, True
    )
    expected_date = datetime.utcnow() + timedelta(days=1)
    
    # Allow for small time differences due to test execution time
    assert abs((next_review - expected_date).total_seconds()) < 60

def test_calculate_next_review_hard_incorrect():
    """Test next review calculation for hard difficulty with incorrect answer"""
    next_review = SpacedRepetitionService.calculate_next_review(
        Difficulty.HARD, 2, False
    )
    expected_date = datetime.utcnow() + timedelta(days=1)
    
    # Should reset to first interval when incorrect
    assert abs((next_review - expected_date).total_seconds()) < 60

def test_calculate_next_review_progression():
    """Test that intervals increase correctly with repetition"""
    # First review for medium difficulty
    first_review = SpacedRepetitionService.calculate_next_review(
        Difficulty.MEDIUM, 0, True
    )
    
    # Second review for medium difficulty  
    second_review = SpacedRepetitionService.calculate_next_review(
        Difficulty.MEDIUM, 1, True
    )
    
    # Second review should be scheduled later than first
    assert second_review > first_review

def test_intervals_different_difficulties():
    """Test that different difficulties have different interval patterns"""
    easy_intervals = SpacedRepetitionService.INTERVALS[Difficulty.EASY]
    medium_intervals = SpacedRepetitionService.INTERVALS[Difficulty.MEDIUM]
    hard_intervals = SpacedRepetitionService.INTERVALS[Difficulty.HARD]
    
    # Easy should have longer intervals than hard
    assert easy_intervals[1] >= hard_intervals[1]
    assert easy_intervals[2] >= hard_intervals[2]
    
    # All should have at least some intervals
    assert len(easy_intervals) > 0
    assert len(medium_intervals) > 0
    assert len(hard_intervals) > 0