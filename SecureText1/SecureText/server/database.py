from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - Force SQLite for development
DATABASE_URL = "sqlite:///./quiz_app1.db"

# Create engines
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# For async operations, we'll use the same engine for now
async_engine = None  # Not using async for simplicity

# Session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    from models import User, Deck, Card, QuizSession, QuizAnswer  # Import all models
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database initialized successfully!")