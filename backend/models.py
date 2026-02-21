from sqlalchemy import Column, Integer, String, DateTime, Date
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
