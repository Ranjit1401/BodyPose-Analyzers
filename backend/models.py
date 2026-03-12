from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
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
    avg_accuracy = Column(Float, default=0.0)
    total_calories = Column(Integer, default=0)
    streak = Column(Integer, default=0)

    last_login_date = Column(Date, nullable=True)

    # Relationships
    workout_sessions = relationship("WorkoutSession", back_populates="user")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_name = Column(String, nullable=False)
    reps = Column(Integer, default=0)
    duration = Column(Integer, default=0)  # seconds
    date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    exercise_history = relationship("ExerciseHistory", back_populates="session", uselist=False)


class ExerciseHistory(Base):
    __tablename__ = "exercise_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    accuracy = Column(Float, default=0.0)
    calories_estimated = Column(Integer, default=0)

    # Relationships
    session = relationship("WorkoutSession", back_populates="exercise_history")
