from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from database import engine
import models
from jobs import job_scheduler
import os
from dotenv import load_dotenv

load_dotenv()

from routers import auth, decks, cards, quiz, users, import_export

# Create database tables
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    job_scheduler.start()
    yield
    # Shutdown
    job_scheduler.shutdown()

app = FastAPI(
    title="Magizh Quiz API", 
    version="1.0.0",
    description="A comprehensive quiz and flashcard application with spaced repetition and gamification",
    lifespan=lifespan
)

# Add SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.replit\.dev|http://localhost:(5000|3000|8000)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(decks.router, prefix="/api/decks", tags=["decks"])
app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(users.router, prefix="/api/users", tags=["users"])  # GitHub-style user profiles
app.include_router(import_export.router, prefix="/api/import", tags=["import/export"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Magizh Quiz API is running"}

@app.get("/favicon.ico")
async def favicon():
    return {"message": "No favicon configured"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to Magizh Quiz API",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "Google OAuth Authentication",
            "Spaced Repetition Learning",
            "Gamification & Achievements", 
            "GitHub-style User Profiles",
            "Comprehensive Analytics",
            "CSV Import/Export",
            "Multiple Quiz Modes"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 