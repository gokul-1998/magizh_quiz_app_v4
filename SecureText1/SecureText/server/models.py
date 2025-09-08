from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
from datetime import datetime, date

class QuestionType(enum.Enum):
    MCQ = "mcq"
    MULTI_SELECT = "multi_select"
    FILL_BLANK = "fill_blank"

class QuizMode(enum.Enum):
    EXAM = "exam"
    STUDY = "study"
    REVIEW = "review"

class Difficulty(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class FeedbackType(enum.Enum):
    HELPFUL = "helpful"
    UNCLEAR = "unclear"
    ERROR = "error"

class ActionType(enum.Enum):
    CREATE_DECK = "create_deck"
    COMPLETE_QUIZ = "complete_quiz"
    STAR_DECK = "star_deck"
    CREATE_CARD = "create_card"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True)
    username_set = Column(Boolean, default=False)
    bio = Column(Text)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    decks = relationship("Deck", back_populates="owner")
    quiz_sessions = relationship("QuizSession", back_populates="user")
    starred_decks = relationship("DeckStar", back_populates="user")
    comments = relationship("DeckComment", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")
    bookmarks = relationship("CardBookmark", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    streak = relationship("Streak", back_populates="user", uselist=False)
    daily_challenges = relationship("DailyChallenge", back_populates="user")
    card_feedback = relationship("CardFeedback", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")

class Deck(Base):
    __tablename__ = "decks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")
    quiz_sessions = relationship("QuizSession", back_populates="deck")
    stars = relationship("DeckStar", back_populates="deck", cascade="all, delete-orphan")
    comments = relationship("DeckComment", back_populates="deck", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="deck")
    daily_challenges = relationship("DailyChallenge", back_populates="deck")

class DeckStar(Base):
    __tablename__ = "deck_stars"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="starred_decks")
    deck = relationship("Deck", back_populates="stars")

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    options = Column(JSON, default=list)  # For MCQ and multi-select
    correct_answers = Column(JSON, nullable=False)  # Supports multiple correct answers
    explanation = Column(Text)
    image_url = Column(String)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    deck = relationship("Deck", back_populates="cards")
    quiz_answers = relationship("QuizAnswer", back_populates="card")
    bookmarks = relationship("CardBookmark", back_populates="card", cascade="all, delete-orphan")
    feedback = relationship("CardFeedback", back_populates="card", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="card", cascade="all, delete-orphan")

class DeckComment(Base):
    __tablename__ = "deck_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    deck = relationship("Deck", back_populates="comments")
    user = relationship("User", back_populates="comments")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(SQLEnum(ActionType), nullable=False)
    resource_type = Column(String, nullable=False)  # 'deck', 'card', 'quiz'
    resource_id = Column(Integer, nullable=False)
    extra_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")

class CardBookmark(Base):
    __tablename__ = "card_bookmarks"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    card_id = Column(Integer, ForeignKey("cards.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bookmarks")
    card = relationship("Card", back_populates="bookmarks")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    mode = Column(SQLEnum(QuizMode), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    score = Column(Float)
    total_questions = Column(Integer, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="quiz_sessions")
    deck = relationship("Deck", back_populates="quiz_sessions")
    answers = relationship("QuizAnswer", back_populates="session", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    user_answers = Column(JSON, nullable=False)  # User's selected answers
    is_correct = Column(Boolean, nullable=False)
    difficulty_rating = Column(SQLEnum(Difficulty))  # User's difficulty assessment
    time_taken = Column(Integer)  # Time in seconds
    
    # Relationships
    session = relationship("QuizSession", back_populates="answers")
    card = relationship("Card", back_populates="quiz_answers")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), primary_key=True)
    total_attempts = Column(Integer, default=0)
    best_score = Column(Float, default=0.0)
    last_attempt_at = Column(DateTime(timezone=True))
    mastery_level = Column(Float, default=0.0)  # 0-1 scale
    
    # Relationships
    user = relationship("User", back_populates="progress")
    deck = relationship("Deck", back_populates="progress")

class Streak(Base):
    __tablename__ = "streaks"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="streak")

class DailyChallenge(Base):
    __tablename__ = "daily_challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Float)
    accuracy_percent = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="daily_challenges")
    deck = relationship("Deck", back_populates="daily_challenges")

class CardFeedback(Base):
    __tablename__ = "card_feedback"
    
    card_id = Column(Integer, ForeignKey("cards.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    feedback_type = Column(SQLEnum(FeedbackType), nullable=False)
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    card = relationship("Card", back_populates="feedback")
    user = relationship("User", back_populates="card_feedback")

class StudyPlan(Base):
    __tablename__ = "study_plans"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    card_id = Column(Integer, ForeignKey("cards.id"), primary_key=True)
    repetition_count = Column(Integer, default=0)
    next_review_at = Column(DateTime(timezone=True))
    difficulty = Column(SQLEnum(Difficulty), default=Difficulty.MEDIUM)
    
    # Relationships
    user = relationship("User", back_populates="study_plans")
    card = relationship("Card", back_populates="study_plans")