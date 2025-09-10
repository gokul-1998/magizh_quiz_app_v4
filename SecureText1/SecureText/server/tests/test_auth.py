import pytest

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_demo_login(client):
    """Test demo login functionality"""
    response = client.post("/api/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "demo@magizh.app"

def test_get_current_user_without_auth(client):
    """Test getting current user without authentication"""
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_get_current_user_with_auth(client):
    """Test getting current user with authentication"""
    # First login to get token
    login_response = client.post("/api/auth/demo-login")
    token = login_response.json()["access_token"]
    
    # Then get current user
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "demo@magizh.app"

def test_logout(client):
    """Test logout functionality"""
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"