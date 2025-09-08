from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class QuestionType(str, Enum):
    MCQ = "mcq"
    MULTI_SELECT = "multi_select"
    FILL_BLANK = "fill_blank"

class QuizMode(str, Enum):
    EXAM = "exam"
    STUDY = "study"
    REVIEW = "review"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class FeedbackType(str, Enum):
    HELPFUL = "helpful"
    UNCLEAR = "unclear"
    ERROR = "error"

# User schemas
class UserBase(BaseModel):
    email: str
    name: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class UserResponse(UserBase):
    id: int
    username_set: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Deck schemas
class DeckBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []

class DeckCreate(DeckBase):
    pass

class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None

class DeckResponse(DeckBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: UserResponse
    card_count: Optional[int] = 0
    is_starred: Optional[bool] = False
    
    class Config:
        from_attributes = True

# Card schemas
class CardBase(BaseModel):
    question: str = Field(..., min_length=1)
    question_type: QuestionType
    options: List[str] = []
    correct_answers: List[str] = Field(..., min_length=1)
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    tags: List[str] = []

class CardCreate(CardBase):
    deck_id: int

class CardUpdate(BaseModel):
    question: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[List[str]] = None
    correct_answers: Optional[List[str]] = None
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None

class CardResponse(CardBase):
    id: int
    deck_id: int
    created_at: datetime
    is_bookmarked: Optional[bool] = False
    
    class Config:
        from_attributes = True

# Quiz schemas
class QuizSessionCreate(BaseModel):
    deck_id: int
    mode: QuizMode

class QuizAnswerSubmit(BaseModel):
    card_id: int
    user_answers: List[str]
    difficulty_rating: Optional[Difficulty] = None
    time_taken: Optional[int] = None  # seconds

class QuizSessionResponse(BaseModel):
    id: int
    deck_id: int
    mode: QuizMode
    started_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    total_questions: int
    deck: DeckResponse
    
    class Config:
        from_attributes = True

# Progress schemas
class ProgressResponse(BaseModel):
    deck_id: int
    total_attempts: int
    best_score: float
    last_attempt_at: Optional[datetime] = None
    mastery_level: float
    deck: DeckResponse
    
    class Config:
        from_attributes = True

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Comment schemas
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class CommentResponse(BaseModel):
    id: int
    deck_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserResponse
    
    class Config:
        from_attributes = True

# Analytics schemas
class DashboardStats(BaseModel):
    total_decks: int
    total_cards_studied: int
    current_streak: int
    total_quiz_sessions: int
    average_score: float
    weekly_activity: List[int]  # 7 days of activity

class DeckStats(BaseModel):
    total_attempts: int
    average_score: float
    completion_rate: float
    difficulty_breakdown: Dict[str, int]
    recent_scores: List[float]

# Generic responses
class MessageResponse(BaseModel):
    message: str

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int