from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.starlette_client import OAuthError
from starlette.config import Config
import httpx
from database import get_db
from schemas import UserResponse, UserCreate, MessageResponse
from auth import create_access_token, get_current_user, get_current_user_optional
import models
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv('../.env')

# OAuth configuration with SSL handling
config = Config()
oauth = OAuth(config)

# Create HTTP client with proper SSL configuration
http_client = httpx.AsyncClient(
    verify=True,  # Enable SSL verification
    timeout=30.0,
    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    },
    # Use custom HTTP client
    client=http_client
)

router = APIRouter()

@router.get("/google")
async def google_auth(request: Request):
    """Initiate Google OAuth flow"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        # Check if user exists
        existing_user = db.query(models.User).filter(
            models.User.google_id == user_info['sub']
        ).first()
        
        if existing_user:
            user = existing_user
        else:
            # Create new user
            user = models.User(
                email=user_info['email'],
                google_id=user_info['sub'],
                name=user_info['name'],
                avatar_url=user_info.get('picture'),
                username_set=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Create redirect response first
        if not user.username_set:
            redirect_response = RedirectResponse(url="http://localhost:5000/complete-signup")
        else:
            redirect_response = RedirectResponse(url="http://localhost:5000/dashboard")
        
        # Set HTTP-only cookie on redirect response
        redirect_response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=1800,
            secure=False,  # Set to False for localhost development
            samesite='lax',
            domain="localhost",  # Explicitly set domain
            path="/"  # Ensure cookie is available for all paths
        )
        
        return redirect_response
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")

@router.post("/demo-login", response_model=dict)
async def demo_login(response: Response, db: Session = Depends(get_db)):
    """Demo login for testing - creates/gets demo user"""
    # Check if demo user exists
    demo_user = db.query(models.User).filter(models.User.email == "demo@magizh.app").first()
    
    if not demo_user:
        # Create demo user
        demo_user = models.User(
            email="demo@magizh.app",
            google_id="demo-google-id",
            name="Demo User",
            username="demo_user",
            username_set=True,
            bio="Welcome to Magizh Quiz! This is a demo account.",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": demo_user.email}, expires_delta=access_token_expires
    )
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,
        secure=False,  # For development
        samesite='lax'
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "email": demo_user.email,
            "name": demo_user.name,
            "username": demo_user.username,
            "username_set": demo_user.username_set,
            "created_at": demo_user.created_at
        }
    }

@router.post("/complete-signup", response_model=UserResponse)
async def complete_signup(user_data: UserCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Complete user signup with username selection"""
    # Check if username is already taken
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Update user with username
    current_user.username = user_data.username
    current_user.username_set = True
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "username_set": current_user.username_set,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }