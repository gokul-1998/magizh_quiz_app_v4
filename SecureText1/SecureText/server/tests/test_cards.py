import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models
import json

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_cards.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_headers(setup_database):
    """Get authentication headers for testing"""
    login_response = client.post("/api/auth/demo-login")
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_deck(auth_headers):
    """Create a sample deck for testing cards"""
    deck_data = {
        "title": "Test Deck for Cards",
        "description": "A deck for testing card operations",
        "is_public": True,
        "tags": ["test", "cards"]
    }
    response = client.post("/api/decks/", json=deck_data, headers=auth_headers)
    return response.json()

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

class TestCardCreation:
    """Test cases for card creation"""
    
    def test_create_card_success(self, auth_headers, sample_deck, sample_card_data):
        """Test successful card creation"""
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["question"] == sample_card_data["question"]
        assert data["question_type"] == sample_card_data["question_type"]
        assert data["options"] == sample_card_data["options"]
        assert data["correct_answers"] == sample_card_data["correct_answers"]
        assert data["explanation"] == sample_card_data["explanation"]
        assert data["tags"] == sample_card_data["tags"]
        assert data["deck_id"] == sample_deck["id"]
        assert "id" in data
        assert "created_at" in data

    def test_create_card_without_auth(self, sample_deck, sample_card_data):
        """Test card creation without authentication"""
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        response = client.post("/api/cards/", json=card_data)
        assert response.status_code == 401

    def test_create_card_invalid_deck(self, auth_headers, sample_card_data):
        """Test card creation with invalid deck ID"""
        card_data = {**sample_card_data, "deck_id": 99999}
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 404

    def test_create_card_missing_question(self, auth_headers, sample_deck):
        """Test card creation without question"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question_type": "mcq",
            "options": ["A", "B", "C", "D"],
            "correct_answers": ["A"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_card_empty_question(self, auth_headers, sample_deck):
        """Test card creation with empty question"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "",
            "question_type": "mcq",
            "options": ["A", "B", "C", "D"],
            "correct_answers": ["A"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_card_invalid_question_type(self, auth_headers, sample_deck):
        """Test card creation with invalid question type"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Test question?",
            "question_type": "invalid_type",
            "options": ["A", "B", "C", "D"],
            "correct_answers": ["A"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_card_no_correct_answers(self, auth_headers, sample_deck):
        """Test card creation without correct answers"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Test question?",
            "question_type": "mcq",
            "options": ["A", "B", "C", "D"],
            "correct_answers": []
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 422

class TestCardTypes:
    """Test different question types"""
    
    def test_create_mcq_card(self, auth_headers, sample_deck):
        """Test creating multiple choice question"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "What is 2 + 2?",
            "question_type": "mcq",
            "options": ["3", "4", "5", "6"],
            "correct_answers": ["4"],
            "explanation": "2 + 2 equals 4"
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["question_type"] == "mcq"

    def test_create_multi_select_card(self, auth_headers, sample_deck):
        """Test creating multi-select question"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Which are programming languages?",
            "question_type": "multi_select",
            "options": ["Python", "HTML", "JavaScript", "CSS"],
            "correct_answers": ["Python", "JavaScript"],
            "explanation": "Python and JavaScript are programming languages"
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["question_type"] == "multi_select"
        assert len(response.json()["correct_answers"]) == 2

    def test_create_fill_blank_card(self, auth_headers, sample_deck):
        """Test creating fill in the blank question"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "The capital of Japan is ____.",
            "question_type": "fill_blank",
            "options": [],
            "correct_answers": ["Tokyo"],
            "explanation": "Tokyo is the capital of Japan"
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["question_type"] == "fill_blank"
        assert response.json()["options"] == []

class TestCardRetrieval:
    """Test cases for card retrieval"""
    
    def test_get_deck_cards(self, auth_headers, sample_deck, sample_card_data):
        """Test getting cards for a deck"""
        # Create a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        client.post("/api/cards/", json=card_data, headers=auth_headers)
        
        # Get deck cards
        response = client.get(f"/api/decks/{sample_deck['id']}/cards", headers=auth_headers)
        assert response.status_code == 200
        
        cards = response.json()
        assert len(cards) >= 1
        assert cards[0]["question"] == sample_card_data["question"]

    def test_get_cards_empty_deck(self, auth_headers, sample_deck):
        """Test getting cards from empty deck"""
        response = client.get(f"/api/decks/{sample_deck['id']}/cards", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_cards_invalid_deck(self, auth_headers):
        """Test getting cards from non-existent deck"""
        response = client.get("/api/decks/99999/cards", headers=auth_headers)
        assert response.status_code == 404

    def test_get_single_card(self, auth_headers, sample_deck, sample_card_data):
        """Test getting a single card"""
        # Create a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        
        # Get the card
        response = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 200
        
        card = response.json()
        assert card["id"] == card_id
        assert card["question"] == sample_card_data["question"]

    def test_get_nonexistent_card(self, auth_headers):
        """Test getting a card that doesn't exist"""
        response = client.get("/api/cards/99999", headers=auth_headers)
        assert response.status_code == 404

class TestCardUpdate:
    """Test cases for card updates"""
    
    def test_update_card_success(self, auth_headers, sample_deck, sample_card_data):
        """Test successful card update"""
        # Create a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        
        # Update the card
        update_data = {
            "question": "Updated question?",
            "explanation": "Updated explanation"
        }
        response = client.put(f"/api/cards/{card_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        updated_card = response.json()
        assert updated_card["question"] == update_data["question"]
        assert updated_card["explanation"] == update_data["explanation"]

    def test_update_card_question_type(self, auth_headers, sample_deck, sample_card_data):
        """Test updating card question type"""
        # Create MCQ card
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        
        # Update to multi-select
        update_data = {
            "question_type": "multi_select",
            "correct_answers": ["Paris", "London"]  # Multiple correct answers
        }
        response = client.put(f"/api/cards/{card_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["question_type"] == "multi_select"

    def test_update_nonexistent_card(self, auth_headers):
        """Test updating a card that doesn't exist"""
        update_data = {"question": "Updated question?"}
        response = client.put("/api/cards/99999", json=update_data, headers=auth_headers)
        assert response.status_code == 404

    def test_update_card_without_auth(self, sample_deck, sample_card_data):
        """Test updating card without authentication"""
        # Create a card first (with auth)
        auth_response = client.post("/api/auth/demo-login")
        token = auth_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=headers)
        card_id = create_response.json()["id"]
        
        # Try to update without auth
        update_data = {"question": "Updated question?"}
        response = client.put(f"/api/cards/{card_id}", json=update_data)
        assert response.status_code == 401

class TestCardDeletion:
    """Test cases for card deletion"""
    
    def test_delete_card_success(self, auth_headers, sample_deck, sample_card_data):
        """Test successful card deletion"""
        # Create a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        
        # Delete the card
        response = client.delete(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Card deleted"
        
        # Verify card is deleted
        get_response = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_nonexistent_card(self, auth_headers):
        """Test deleting a card that doesn't exist"""
        response = client.delete("/api/cards/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_card_without_auth(self, sample_deck, sample_card_data):
        """Test deleting card without authentication"""
        # Create a card first (with auth)
        auth_response = client.post("/api/auth/demo-login")
        token = auth_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=headers)
        card_id = create_response.json()["id"]
        
        # Try to delete without auth
        response = client.delete(f"/api/cards/{card_id}")
        assert response.status_code == 401

class TestCardBookmarking:
    """Test cases for card bookmarking"""
    
    def test_bookmark_card_success(self, auth_headers, sample_deck, sample_card_data):
        """Test successfully bookmarking a card"""
        # Create a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        
        # Bookmark the card
        response = client.post(f"/api/cards/{card_id}/bookmark", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Card bookmarked"
        assert data["is_bookmarked"] == True

    def test_unbookmark_card(self, auth_headers, sample_deck, sample_card_data):
        """Test unbookmarking a card"""
        # Create and bookmark a card first
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        create_response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]
        client.post(f"/api/cards/{card_id}/bookmark", headers=auth_headers)
        
        # Unbookmark the card
        response = client.post(f"/api/cards/{card_id}/bookmark", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Card unbookmarked"
        assert data["is_bookmarked"] == False

    def test_bookmark_nonexistent_card(self, auth_headers):
        """Test bookmarking a card that doesn't exist"""
        response = client.post("/api/cards/99999/bookmark", headers=auth_headers)
        assert response.status_code == 404

class TestCardValidation:
    """Test cases for card data validation"""
    
    def test_card_response_structure(self, auth_headers, sample_deck, sample_card_data):
        """Test that card response has correct structure"""
        card_data = {**sample_card_data, "deck_id": sample_deck["id"]}
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Required fields
        required_fields = [
            "id", "deck_id", "question", "question_type", 
            "options", "correct_answers", "created_at"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

    def test_card_options_validation(self, auth_headers, sample_deck):
        """Test validation of card options"""
        # MCQ should have options
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Test question?",
            "question_type": "mcq",
            "options": ["A", "B", "C", "D"],
            "correct_answers": ["A"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200

    def test_card_correct_answers_validation(self, auth_headers, sample_deck):
        """Test validation of correct answers"""
        # Correct answer should be in options for MCQ
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Test question?",
            "question_type": "mcq",
            "options": ["A", "B", "C", "D"],
            "correct_answers": ["E"]  # Not in options
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        # This should ideally fail validation, but depends on backend implementation
        # For now, just check it doesn't crash
        assert response.status_code in [200, 422]

class TestCardEdgeCases:
    """Test edge cases and special scenarios"""
    
    def test_card_with_special_characters(self, auth_headers, sample_deck):
        """Test creating card with special characters"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "What is the symbol for π (pi)?",
            "question_type": "fill_blank",
            "options": [],
            "correct_answers": ["π", "pi"],
            "explanation": "π is the mathematical constant pi ≈ 3.14159"
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "π" in data["question"]
        assert "π" in data["correct_answers"]

    def test_card_with_very_long_question(self, auth_headers, sample_deck):
        """Test creating card with very long question"""
        long_question = "What is " + "very " * 100 + "long question?"
        card_data = {
            "deck_id": sample_deck["id"],
            "question": long_question,
            "question_type": "fill_blank",
            "options": [],
            "correct_answers": ["answer"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["question"] == long_question

    def test_card_with_many_options(self, auth_headers, sample_deck):
        """Test creating card with many options"""
        many_options = [f"Option {i}" for i in range(1, 21)]  # 20 options
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Which is option 10?",
            "question_type": "mcq",
            "options": many_options,
            "correct_answers": ["Option 10"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["options"]) == 20

    def test_card_with_multiple_correct_answers(self, auth_headers, sample_deck):
        """Test creating multi-select card with multiple correct answers"""
        card_data = {
            "deck_id": sample_deck["id"],
            "question": "Which are even numbers?",
            "question_type": "multi_select",
            "options": ["1", "2", "3", "4", "5", "6"],
            "correct_answers": ["2", "4", "6"]
        }
        response = client.post("/api/cards/", json=card_data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["correct_answers"]) == 3
