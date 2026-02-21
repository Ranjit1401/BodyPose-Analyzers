from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
from fastapi.security import OAuth2PasswordRequestForm
from datetime import date, timedelta
from fastapi import File, UploadFile
import numpy as np
import cv2
from pose.detector import detect_landmarks
import models
import schemas
from database import engine, SessionLocal
from exercises.squat import analyze_squat
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_reset_token,
    verify_reset_token,
)
from fastapi_mail import FastMail, MessageSchema
from email_config import conf
from dotenv import load_dotenv
from fastapi import Body


# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DB Dependency --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------- JWT Auth Setup --------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# -------------------- Register --------------------
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

# -------------------- Login --------------------
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    today = date.today()

    # 🔥 STREAK LOGIC
    if db_user.last_login_date is None:
        db_user.streak = 1

    elif db_user.last_login_date == today:
        # Already logged in today → do nothing
        pass

    elif db_user.last_login_date == today - timedelta(days=1):
        # Logged in yesterday → increase streak
        db_user.streak += 1

    else:
        # Missed a day → reset streak
        db_user.streak = 1

    db_user.last_login_date = today
    db.commit()

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------- Forgot Password --------------------
@app.post("/forgot-password")
async def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_reset_token(user.email)

    # 🔥 IMPORTANT: Change port to 5173 for Vite
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[user.email],
        body=f"Click the link to reset your password:\n\n{reset_link}",
        subtype="plain",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {"message": "Password reset link sent to email"}

# -------------------- Reset Password --------------------
@app.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):

    email = verify_reset_token(data.token)

    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}

# -------------------- Protected Test Route --------------------
@app.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# -------------------- Profile Route --------------------
@app.get("/api/profile")
def get_profile(current_user: models.User = Depends(get_current_user)):

    return {
        "user": {
            "name": current_user.username,
            "email": current_user.email,
            "goal": current_user.goal,
            "joinDate": current_user.created_at.strftime("%Y-%m-%d")
        },
        "stats": {
            "totalWorkouts": current_user.total_workouts,
            "avgAccuracy": current_user.avg_accuracy,
            "totalCalories": current_user.total_calories,
            "streak": current_user.streak
        },
        "progress": []
    }
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    joints = detect_landmarks(image)

    if joints is None:
        return {"status": "No body detected"}

    result = analyze_squat(joints)

    return {
        "status": "Body detected",
        "analysis": result
    }

@app.post("/analyze-landmarks")
async def analyze_landmarks(data: dict = Body(...)):
    landmarks = data.get("landmarks")

    if not landmarks:
        return {"error": "No landmarks received"}

    # Convert frontend landmarks into joints format
    joints = {
        "left_shoulder": (landmarks[11]["x"], landmarks[11]["y"]),
        "right_shoulder": (landmarks[12]["x"], landmarks[12]["y"]),
        "left_hip": (landmarks[23]["x"], landmarks[23]["y"]),
        "right_hip": (landmarks[24]["x"], landmarks[24]["y"]),
        "left_knee": (landmarks[25]["x"], landmarks[25]["y"]),
        "right_knee": (landmarks[26]["x"], landmarks[26]["y"]),
        "left_ankle": (landmarks[27]["x"], landmarks[27]["y"]),
        "right_ankle": (landmarks[28]["x"], landmarks[28]["y"]),
    }

    result = analyze_squat(joints)

    return {"analysis": result}



