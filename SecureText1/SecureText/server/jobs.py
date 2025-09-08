from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import SessionLocal
from models import User, DailyChallenge, Deck, Streak
from services.gamification import GamificationService
import random
import logging

logger = logging.getLogger(__name__)

class BackgroundJobs:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.setup_jobs()
    
    def setup_jobs(self):
        """Set up all scheduled jobs"""
        # Daily job at 00:01 - Reset daily challenges and update streaks
        self.scheduler.add_job(
            self.daily_reset,
            CronTrigger(hour=0, minute=1),
            id='daily_reset',
            replace_existing=True
        )
        
        # Weekly job - Generate analytics summaries
        self.scheduler.add_job(
            self.weekly_analytics,
            CronTrigger(day_of_week=0, hour=1, minute=0),  # Sunday 1 AM
            id='weekly_analytics',
            replace_existing=True
        )
        
        # Monthly job - Archive old data
        self.scheduler.add_job(
            self.monthly_cleanup,
            CronTrigger(day=1, hour=2, minute=0),  # 1st of month 2 AM
            id='monthly_cleanup',
            replace_existing=True
        )
    
    async def daily_reset(self):
        """Daily job to reset challenges and update streaks"""
        logger.info("Starting daily reset job")
        db = SessionLocal()
        
        try:
            # Get all active users
            users = db.query(User).all()
            
            for user in users:
                # Create daily challenge for user
                challenge = GamificationService.create_daily_challenge(db, user.id)
                if challenge:
                    logger.info(f"Created daily challenge for user {user.id}")
                
                # Check streak status
                streak = db.query(Streak).filter(Streak.user_id == user.id).first()
                if streak:
                    # Check if user missed yesterday
                    yesterday = date.today() - timedelta(days=1)
                    last_activity = streak.last_activity_date.date() if streak.last_activity_date else None
                    
                    if last_activity and last_activity < yesterday:
                        # Reset streak if no activity yesterday
                        streak.current_streak = 0
                        logger.info(f"Reset streak for user {user.id}")
            
            db.commit()
            logger.info("Daily reset job completed successfully")
            
        except Exception as e:
            logger.error(f"Error in daily reset job: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def weekly_analytics(self):
        """Weekly job to generate analytics summaries"""
        logger.info("Starting weekly analytics job")
        db = SessionLocal()
        
        try:
            # Here you could generate weekly reports
            # For now, just log the completion
            logger.info("Weekly analytics job completed")
            
        except Exception as e:
            logger.error(f"Error in weekly analytics job: {e}")
        finally:
            db.close()
    
    async def monthly_cleanup(self):
        """Monthly job to clean up old data"""
        logger.info("Starting monthly cleanup job")
        db = SessionLocal()
        
        try:
            # Clean up old quiz sessions older than 6 months
            six_months_ago = datetime.utcnow() - timedelta(days=180)
            
            # Here you could add cleanup logic
            # For example: delete old temporary data, compress logs, etc.
            
            logger.info("Monthly cleanup job completed")
            
        except Exception as e:
            logger.error(f"Error in monthly cleanup job: {e}")
        finally:
            db.close()
    
    def start(self):
        """Start the scheduler"""
        self.scheduler.start()
        logger.info("Background job scheduler started")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        self.scheduler.shutdown()
        logger.info("Background job scheduler stopped")

# Global scheduler instance
job_scheduler = BackgroundJobs()