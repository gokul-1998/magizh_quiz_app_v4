import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models
import json

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_decks.db"
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
    # Login to get token
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

class TestDeckCreation:
    """Test cases for deck creation"""
    
    def test_create_deck_success(self, auth_headers, sample_deck_data):
        """Test successful deck creation"""
        response = client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == sample_deck_data["title"]
        assert data["description"] == sample_deck_data["description"]
        assert data["is_public"] == sample_deck_data["is_public"]
        assert data["tags"] == sample_deck_data["tags"]
        assert data["card_count"] == 0
        assert data["is_starred"] == False
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
        assert "owner" in data
        
        # Verify owner structure
        owner = data["owner"]
        assert "id" in owner
        assert "email" in owner
        assert "name" in owner
        assert "username" in owner
        assert "username_set" in owner
        assert "created_at" in owner

    def test_create_deck_without_auth(self, sample_deck_data):
        """Test deck creation without authentication"""
        response = client.post("/api/decks/", json=sample_deck_data)
        assert response.status_code == 401

    def test_create_deck_invalid_data(self, auth_headers):
        """Test deck creation with invalid data"""
        invalid_data = {
            "title": "",  # Empty title should fail
            "description": "Test description",
            "is_public": True,
            "tags": []
        }
        response = client.post("/api/decks/", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_deck_missing_title(self, auth_headers):
        """Test deck creation without title"""
        invalid_data = {
            "description": "Test description",
            "is_public": True,
            "tags": []
        }
        response = client.post("/api/decks/", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_deck_long_title(self, auth_headers):
        """Test deck creation with title exceeding max length"""
        invalid_data = {
            "title": "x" * 201,  # Exceeds 200 char limit
            "description": "Test description",
            "is_public": True,
            "tags": []
        }
        response = client.post("/api/decks/", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_private_deck(self, auth_headers):
        """Test creating a private deck"""
        private_deck_data = {
            "title": "Private Test Deck",
            "description": "A private test deck",
            "is_public": False,
            "tags": ["private", "test"]
        }
        response = client.post("/api/decks/", json=private_deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_public"] == False

    def test_create_deck_with_empty_tags(self, auth_headers):
        """Test creating deck with empty tags"""
        deck_data = {
            "title": "No Tags Deck",
            "description": "Deck without tags",
            "is_public": True,
            "tags": []
        }
        response = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["tags"] == []

class TestDeckRetrieval:
    """Test cases for deck retrieval"""
    
    def test_get_decks_empty(self, auth_headers):
        """Test getting decks when none exist"""
        response = client.get("/api/decks/", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_decks_with_data(self, auth_headers, sample_deck_data):
        """Test getting decks after creating some"""
        # Create a deck first
        client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        
        # Get decks
        response = client.get("/api/decks/", headers=auth_headers)
        assert response.status_code == 200
        
        decks = response.json()
        assert len(decks) >= 1
        assert decks[0]["title"] == sample_deck_data["title"]

    def test_get_decks_pagination(self, auth_headers):
        """Test deck pagination"""
        response = client.get("/api/decks/?skip=0&limit=10", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_decks_public_only(self, auth_headers):
        """Test getting only public decks"""
        response = client.get("/api/decks/?public_only=true", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_decks_search(self, auth_headers, sample_deck_data):
        """Test deck search functionality"""
        # Create a deck first
        client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        
        # Search for it
        response = client.get(f"/api/decks/?search={sample_deck_data['title']}", headers=auth_headers)
        assert response.status_code == 200
        
        decks = response.json()
        assert len(decks) >= 1
        assert sample_deck_data["title"].lower() in decks[0]["title"].lower()

    def test_get_decks_by_tags(self, auth_headers, sample_deck_data):
        """Test filtering decks by tags"""
        # Create a deck first
        client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        
        # Filter by tags
        tag = sample_deck_data["tags"][0]
        response = client.get(f"/api/decks/?tags={tag}", headers=auth_headers)
        assert response.status_code == 200
        
        decks = response.json()
        assert len(decks) >= 1
        assert tag in decks[0]["tags"]

class TestDeckStarring:
    """Test cases for deck starring functionality"""
    
    def test_star_deck_success(self, auth_headers, sample_deck_data):
        """Test successfully starring a deck"""
        # Create a deck first
        create_response = client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        deck_id = create_response.json()["id"]
        
        # Star the deck
        response = client.post(f"/api/decks/{deck_id}/star", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Deck starred"
        assert data["is_starred"] == True

    def test_unstar_deck(self, auth_headers, sample_deck_data):
        """Test unstarring a deck"""
        # Create and star a deck first
        create_response = client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        deck_id = create_response.json()["id"]
        client.post(f"/api/decks/{deck_id}/star", headers=auth_headers)
        
        # Unstar the deck
        response = client.post(f"/api/decks/{deck_id}/star", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Deck unstarred"
        assert data["is_starred"] == False

    def test_star_nonexistent_deck(self, auth_headers):
        """Test starring a deck that doesn't exist"""
        response = client.post("/api/decks/99999/star", headers=auth_headers)
        assert response.status_code == 404

    def test_star_deck_without_auth(self, sample_deck_data):
        """Test starring a deck without authentication"""
        # Create a deck first (with auth)
        auth_response = client.post("/api/auth/demo-login")
        token = auth_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        create_response = client.post("/api/decks/", json=sample_deck_data, headers=headers)
        deck_id = create_response.json()["id"]
        
        # Try to star without auth
        response = client.post(f"/api/decks/{deck_id}/star")
        assert response.status_code == 401

class TestDeckValidation:
    """Test cases for deck data validation"""
    
    def test_deck_response_structure(self, auth_headers, sample_deck_data):
        """Test that deck response has correct structure"""
        response = client.post("/api/decks/", json=sample_deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Required fields
        required_fields = [
            "id", "title", "description", "user_id", "is_public", 
            "tags", "created_at", "owner", "card_count", "is_starred"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Owner structure
        owner_fields = [
            "id", "email", "name", "username", "username_set", "created_at"
        ]
        for field in owner_fields:
            assert field in data["owner"], f"Missing owner field: {field}"

    def test_deck_tags_array_format(self, auth_headers):
        """Test that tags are properly formatted as array"""
        deck_data = {
            "title": "Tags Test Deck",
            "description": "Testing tag formats",
            "is_public": True,
            "tags": ["tag1", "tag2", "tag3"]
        }
        response = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data["tags"], list)
        assert len(data["tags"]) == 3
        assert "tag1" in data["tags"]

class TestDeckEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_create_deck_with_special_characters(self, auth_headers):
        """Test creating deck with special characters in title"""
        special_deck_data = {
            "title": "Test Deck with émojis 🚀 & symbols!@#$%",
            "description": "Testing special characters: àáâãäåæçèéêë",
            "is_public": True,
            "tags": ["special-chars", "émojis"]
        }
        response = client.post("/api/decks/", json=special_deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == special_deck_data["title"]

    def test_create_deck_with_very_long_description(self, auth_headers):
        """Test creating deck with very long description"""
        long_description = "x" * 5000  # Very long description
        deck_data = {
            "title": "Long Description Deck",
            "description": long_description,
            "is_public": True,
            "tags": []
        }
        response = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["description"] == long_description

    def test_create_multiple_decks_same_title(self, auth_headers):
        """Test creating multiple decks with same title (should be allowed)"""
        deck_data = {
            "title": "Duplicate Title",
            "description": "First deck",
            "is_public": True,
            "tags": []
        }
        
        # Create first deck
        response1 = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        assert response1.status_code == 200
        
        # Create second deck with same title
        deck_data["description"] = "Second deck"
        response2 = client.post("/api/decks/", json=deck_data, headers=auth_headers)
        assert response2.status_code == 200
        
        # Should have different IDs
        assert response1.json()["id"] != response2.json()["id"]
