from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    goal = Column(String, default="Not Set")

    total_workouts = Column(Integer, default=0)
    avg_accuracy = Column(Integer, default=0)
    total_calories = Column(Integer, default=0)
    streak = Column(Integer, default=0)

    # 🔥 New field for login streak tracking
    last_login_date = Column(Date, nullable=True)


# ─── WORKOUT SESSIONS ──────────────────────────────────────────────────────────
class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise = Column(String, nullable=False)
    reps     = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    duration = Column(Integer, default=0)  # seconds
    date     = Column(DateTime, default=datetime.utcnow)
