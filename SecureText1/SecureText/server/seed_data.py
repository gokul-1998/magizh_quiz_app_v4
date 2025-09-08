from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

def create_sample_data():
    """Create sample data for development and testing"""
    db = SessionLocal()
    
    try:
        # Check if demo user already exists
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
            print("Created demo user")

        # Check if sample decks exist
        existing_decks = db.query(models.Deck).filter(models.Deck.user_id == demo_user.id).count()
        
        if existing_decks == 0:
            # Create sample decks
            deck1 = models.Deck(
                title="JavaScript Basics",
                description="Learn the fundamentals of JavaScript programming",
                user_id=demo_user.id,
                is_public=True,
                tags=["javascript", "programming", "web"]
            )
            
            deck2 = models.Deck(
                title="Python Data Structures",
                description="Master lists, dictionaries, and sets in Python",
                user_id=demo_user.id,
                is_public=True,
                tags=["python", "data-structures", "programming"]
            )
            
            deck3 = models.Deck(
                title="React Hooks",
                description="Understanding useState, useEffect, and custom hooks",
                user_id=demo_user.id,
                is_public=True,
                tags=["react", "hooks", "frontend"]
            )
            
            db.add_all([deck1, deck2, deck3])
            db.commit()
            db.refresh(deck1)
            db.refresh(deck2)
            db.refresh(deck3)
            print("Created sample decks")

            # Create sample cards for JavaScript deck
            js_cards = [
                models.Card(
                    deck_id=deck1.id,
                    question="What does 'var' keyword do in JavaScript?",
                    question_type=models.QuestionType.MCQ,
                    options=["Declares a variable", "Creates a function", "Imports a module", "Exports a value"],
                    correct_answers=["Declares a variable"],
                    explanation="The 'var' keyword is used to declare variables in JavaScript.",
                    tags=["variables", "basics"]
                ),
                models.Card(
                    deck_id=deck1.id,
                    question="Which of the following are JavaScript data types?",
                    question_type=models.QuestionType.MULTI_SELECT,
                    options=["string", "number", "boolean", "array", "decimal"],
                    correct_answers=["string", "number", "boolean"],
                    explanation="JavaScript has primitive types: string, number, boolean, undefined, null, symbol, and bigint.",
                    tags=["data-types", "basics"]
                ),
                models.Card(
                    deck_id=deck1.id,
                    question="How do you declare a constant in JavaScript?",
                    question_type=models.QuestionType.MCQ,
                    options=["const", "let", "var", "final"],
                    correct_answers=["const"],
                    explanation="The 'const' keyword is used to declare constants that cannot be reassigned.",
                    tags=["constants", "variables"]
                )
            ]
            
            # Create sample cards for Python deck
            python_cards = [
                models.Card(
                    deck_id=deck2.id,
                    question="Which Python data structure is ordered and mutable?",
                    question_type=models.QuestionType.MCQ,
                    options=["tuple", "list", "set", "frozenset"],
                    correct_answers=["list"],
                    explanation="Lists in Python are ordered collections that can be modified after creation.",
                    tags=["lists", "mutability"]
                ),
                models.Card(
                    deck_id=deck2.id,
                    question="What method would you use to add an item to a Python dictionary?",
                    question_type=models.QuestionType.MCQ,
                    options=["append()", "add()", "insert()", "dict[key] = value"],
                    correct_answers=["dict[key] = value"],
                    explanation="You can add items to a dictionary using bracket notation: dict[key] = value",
                    tags=["dictionaries", "methods"]
                )
            ]
            
            # Create sample cards for React deck
            react_cards = [
                models.Card(
                    deck_id=deck3.id,
                    question="What hook would you use to manage component state?",
                    question_type=models.QuestionType.MCQ,
                    options=["useEffect", "useState", "useContext", "useMemo"],
                    correct_answers=["useState"],
                    explanation="useState is the React hook used to add state to functional components.",
                    tags=["hooks", "state"]
                ),
                models.Card(
                    deck_id=deck3.id,
                    question="When does useEffect run by default?",
                    question_type=models.QuestionType.MCQ,
                    options=["Only on mount", "After every render", "Only on unmount", "Never"],
                    correct_answers=["After every render"],
                    explanation="By default, useEffect runs after every completed render, both on mount and updates.",
                    tags=["useEffect", "lifecycle"]
                )
            ]
            
            all_cards = js_cards + python_cards + react_cards
            db.add_all(all_cards)
            db.commit()
            print("Created sample cards")

            # Create user streak
            streak = models.Streak(
                user_id=demo_user.id,
                current_streak=7,
                longest_streak=12,
                last_activity_date=datetime.utcnow()
            )
            db.add(streak)
            
            # Create sample activity logs
            activity1 = models.ActivityLog(
                user_id=demo_user.id,
                action_type=models.ActionType.COMPLETE_QUIZ,
                resource_type="deck",
                resource_id=deck1.id,
                extra_data={"score": 14, "total": 15, "accuracy": 93.3}
            )
            
            activity2 = models.ActivityLog(
                user_id=demo_user.id,
                action_type=models.ActionType.STAR_DECK,
                resource_type="deck",
                resource_id=deck2.id,
                extra_data={}
            )
            
            db.add_all([streak, activity1, activity2])
            db.commit()
            print("Created user progress data")

        print("Sample data creation completed!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()