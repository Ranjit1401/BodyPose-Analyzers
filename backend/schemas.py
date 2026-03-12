from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# -------------------- Auth Schemas --------------------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=6, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


# -------------------- Profile Schemas --------------------

class ProfileUpdate(BaseModel):
    goal: Optional[str] = None
    username: Optional[str] = None


# -------------------- Workout Schemas --------------------

class WorkoutCreate(BaseModel):
    exercise_name: str
    reps: int = 0
    duration: int = 0  # seconds
    accuracy: float = 0.0
    calories: int = 0


class WorkoutResponse(BaseModel):
    id: int
    exercise_name: str
    reps: int
    duration: int
    date: datetime
    accuracy: float
    calories: int

    class Config:
        from_attributes = True
