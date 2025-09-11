"""
Pytest configuration and shared fixtures for the Magizh Quiz App backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models
import os
import tempfile

# Create a temporary database for each test session
@pytest.fixture(scope="session")
def temp_db():
    """Create a temporary database file for testing"""
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    yield f"sqlite:///{db_path}"
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture(scope="session")
def engine(temp_db):
    """Create database engine for testing"""
    return create_engine(temp_db, connect_args={"check_same_thread": False})

@pytest.fixture(scope="session")
def TestingSessionLocal(engine):
    """Create session factory for testing"""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database(engine):
    """Set up test database schema"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(TestingSessionLocal, setup_database):
    """Create a database session for each test"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def override_get_db(db_session):
    """Override the get_db dependency"""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client(override_get_db):
    """Create fresh test client for each test"""
    client = TestClient(app)
    # Clear any existing cookies/sessions
    client.cookies.clear()
    return client

@pytest.fixture
def demo_user(db_session):
    """Create a demo user for testing"""
    user = models.User(
        email="demo@magizh.app",
        name="Demo User",
        username="demo",
        username_set=True,
        google_id="demo_google_id"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for testing"""
    login_response = client.post("/api/auth/demo-login")
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_deck_data():
    """Sample deck data for testing"""
    return {
        "title": "Test Deck",
        "description": "A test deck for unit testing",
        "is_public": True,
        "tags": ["test", "sample"]
    }

@pytest.fixture
def sample_card_data():
    """Sample card data for testing"""
    return {
        "question": "What is the capital of France?",
        "question_type": "mcq",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correct_answers": ["Paris"],
        "explanation": "Paris is the capital and largest city of France.",
        "tags": ["geography", "capitals"]
    }

@pytest.fixture
def created_deck(client, auth_headers, sample_deck_data):
    """Create a deck for testing"""
    response = client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
    return response.json()

@pytest.fixture
def created_card(client, auth_headers, created_deck, sample_card_data):
    """Create a card for testing"""
    card_data = {**sample_card_data, "deck_id": created_deck["id"]}
    response = client.post("/api/cards/", json=card_data, headers=auth_headers)
    return response.json()

# Test data factories
class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_user_data(username="testuser", email="test@example.com"):
        """Create user data"""
        return {
            "email": email,
            "name": f"Test User {username}",
            "username": username,
            "bio": f"Bio for {username}",
            "avatar_url": f"https://example.com/{username}.jpg"
        }
    
    @staticmethod
    def create_deck_data(title="Test Deck", is_public=True):
        """Create deck data"""
        return {
            "title": title,
            "description": f"Description for {title}",
            "is_public": is_public,
            "tags": ["test", "sample"]
        }
    
    @staticmethod
    def create_mcq_card_data(question="Test question?"):
        """Create MCQ card data"""
        return {
            "question": question,
            "question_type": "mcq",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answers": ["Option A"],
            "explanation": f"Explanation for {question}",
            "tags": ["test"]
        }
    
    @staticmethod
    def create_multi_select_card_data(question="Multi-select question?"):
        """Create multi-select card data"""
        return {
            "question": question,
            "question_type": "multi_select",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answers": ["Option A", "Option C"],
            "explanation": f"Explanation for {question}",
            "tags": ["test"]
        }
    
    @staticmethod
    def create_fill_blank_card_data(question="Fill in the blank: ____"):
        """Create fill-in-the-blank card data"""
        return {
            "question": question,
            "question_type": "fill_blank",
            "options": [],
            "correct_answers": ["answer"],
            "explanation": f"Explanation for {question}",
            "tags": ["test"]
        }

@pytest.fixture
def test_data_factory():
    """Provide test data factory"""
    return TestDataFactory

# Performance testing fixtures
@pytest.fixture
def large_dataset(client, auth_headers, test_data_factory):
    """Create a large dataset for performance testing"""
    decks = []
    cards = []
    
    # Create 10 decks
    for i in range(10):
        deck_data = test_data_factory.create_deck_data(f"Performance Deck {i}")
        response = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        deck = response.json()
        decks.append(deck)
        
        # Create 20 cards per deck
        for j in range(20):
            card_data = test_data_factory.create_mcq_card_data(f"Question {j} for deck {i}")
            card_data["deck_id"] = deck["id"]
            response = client.post("/api/cards/", json=card_data, headers=auth_headers)
            cards.append(response.json())
    
    return {"decks": decks, "cards": cards}

# Error simulation fixtures
@pytest.fixture
def mock_db_error(monkeypatch):
    """Mock database error for testing error handling"""
    def mock_commit():
        raise Exception("Database connection error")
    
    monkeypatch.setattr("sqlalchemy.orm.Session.commit", mock_commit)

# Validation test fixtures
@pytest.fixture
def invalid_deck_data():
    """Invalid deck data for validation testing"""
    return [
        {"title": "", "description": "Valid description"},  # Empty title
        {"title": "x" * 201, "description": "Valid description"},  # Title too long
        {"description": "Valid description"},  # Missing title
        {"title": "Valid title", "is_public": "not_boolean"},  # Invalid boolean
        {"title": "Valid title", "tags": "not_array"}  # Invalid tags format
    ]

@pytest.fixture
def invalid_card_data():
    """Invalid card data for validation testing"""
    return [
        {"question": "", "question_type": "mcq"},  # Empty question
        {"question": "Valid question", "question_type": "invalid"},  # Invalid type
        {"question": "Valid question", "question_type": "mcq", "correct_answers": []},  # No correct answers
        {"question_type": "mcq", "correct_answers": ["A"]},  # Missing question
        {"question": "Valid question", "correct_answers": ["A"]}  # Missing question_type
    ]

# Authentication test fixtures
@pytest.fixture
def expired_token():
    """Expired JWT token for testing"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid"

@pytest.fixture
def invalid_token():
    """Invalid JWT token for testing"""
    return "invalid.jwt.token"

# Cleanup fixtures
@pytest.fixture(autouse=True)
def cleanup_after_test(db_session):
    """Clean up database after each test"""
    yield
    # Clean up any test data
    db_session.rollback()
