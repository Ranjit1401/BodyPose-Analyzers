from fastapi import FastAPI
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("VIRTUALTRAINER_API_KEY")

class CoachRequest(BaseModel):
    message: str

@app.post("/ai-coach")
async def ai_coach(data: CoachRequest):
    prompt = f"""
You are a professional fitness trainer.
Provide short coaching advice based on the user's question.

User said:
{data.message}
"""
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    reply = response.json()["choices"][0]["message"]["content"]
    return {"reply": reply}
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
import os
import requests
from datetime import date, timedelta, datetime
from fastapi import File, UploadFile
import numpy as np
import cv2
from pose.detector import detect_landmarks, get_joint_landmarks
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
from dotenv import load_dotenv
from fastapi import Body
from typing import List
import tempfile
import io

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fitflicks-secret-key-change-in-production")
ALGORITHM = "HS256"

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitFlicks API", description="Body Pose Analyzer Backend", version="1.0.0")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

    # Streak logic
    if db_user.last_login_date is None:
        db_user.streak = 1
    elif db_user.last_login_date == today:
        pass
    elif db_user.last_login_date == today - timedelta(days=1):
        db_user.streak += 1
    else:
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
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    # Try to send email, but don't fail if email is not configured
    try:
        from fastapi_mail import FastMail, MessageSchema
        from email_config import conf

        message = MessageSchema(
            subject="Password Reset Request",
            recipients=[user.email],
            body=f"Click the link to reset your password:\n\n{reset_link}",
            subtype="plain",
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        return {"message": "Password reset link sent to email"}
    except Exception:
        # If email not configured, return the token directly (dev mode)
        return {"message": "Email not configured. Use this token to reset.", "token": token}

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

# -------------------- Current User --------------------
@app.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# -------------------- Profile --------------------
@app.get("/api/profile")
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get workout count and stats from actual data
    workout_count = db.query(func.count(models.WorkoutSession.id)).filter(
        models.WorkoutSession.user_id == current_user.id
    ).scalar() or 0

    total_calories = db.query(func.coalesce(func.sum(models.ExerciseHistory.calories_estimated), 0)).join(
        models.WorkoutSession
    ).filter(
        models.WorkoutSession.user_id == current_user.id
    ).scalar() or 0

    avg_accuracy = db.query(func.coalesce(func.avg(models.ExerciseHistory.accuracy), 0)).join(
        models.WorkoutSession
    ).filter(
        models.WorkoutSession.user_id == current_user.id
    ).scalar() or 0

    # Get recent workout dates for progress heatmap (last 90 days)
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    recent_workouts = db.query(
        func.date(models.WorkoutSession.date),
        func.count(models.WorkoutSession.id)
    ).filter(
        models.WorkoutSession.user_id == current_user.id,
        models.WorkoutSession.date >= ninety_days_ago
    ).group_by(
        func.date(models.WorkoutSession.date)
    ).all()

    progress = [{"date": str(d), "count": c} for d, c in recent_workouts]

    return {
        "user": {
            "name": current_user.username,
            "email": current_user.email,
            "goal": current_user.goal,
            "joinDate": current_user.created_at.strftime("%Y-%m-%d") if current_user.created_at else "-"
        },
        "stats": {
            "totalWorkouts": workout_count,
            "avgAccuracy": round(float(avg_accuracy), 1),
            "totalCalories": int(total_calories),
            "streak": current_user.streak or 0
        },
        "progress": progress
    }

# -------------------- Update Profile --------------------
@app.put("/api/profile")
def update_profile(
    data: schemas.ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.goal is not None:
        current_user.goal = data.goal
    if data.username is not None:
        current_user.username = data.username

    db.commit()
    db.refresh(current_user)

    return {"message": "Profile updated successfully"}

# -------------------- Save Workout --------------------
@app.post("/api/workouts", status_code=status.HTTP_201_CREATED)
def save_workout(
    workout: schemas.WorkoutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create workout session
    new_session = models.WorkoutSession(
        user_id=current_user.id,
        exercise_name=workout.exercise_name,
        reps=workout.reps,
        duration=workout.duration,
        date=datetime.utcnow()
    )
    db.add(new_session)
    db.flush()  # Get the session ID

    # Create exercise history
    new_history = models.ExerciseHistory(
        session_id=new_session.id,
        accuracy=workout.accuracy,
        calories_estimated=workout.calories
    )
    db.add(new_history)

    # Update user aggregate stats
    current_user.total_workouts = (current_user.total_workouts or 0) + 1
    current_user.total_calories = (current_user.total_calories or 0) + workout.calories

    # Recalculate average accuracy
    total_sessions = current_user.total_workouts
    if total_sessions > 0:
        prev_total = (current_user.avg_accuracy or 0) * (total_sessions - 1)
        current_user.avg_accuracy = round((prev_total + workout.accuracy) / total_sessions, 1)

    db.commit()

    # Generate AI Feedback
    ai_feedback = f"Great job on your {workout.exercise_name}! You achieved {workout.accuracy}% accuracy."
    api_key = os.getenv("VIRTUALTRAINER_API_KEY") or os.environ.get("VIRTUALTRAINER_API_KEY")
    if api_key:
        try:
            prompt = f"Act as a professional virtual personal trainer. You are giving short, encouraging post-workout feedback to {current_user.username}. They just completed {workout.reps} reps of {workout.exercise_name} with {workout.accuracy}% form accuracy, burning {workout.calories} calories. Give them 1-2 sentences of motivational and corrective advice. Be energetic."
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "Virtual Trainer AI",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemini-2.5-flash-free",
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=5
            )
            if response.status_code == 200:
                ai_feedback = response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"AI Coach Error: {e}")

    return {
        "message": "Workout saved successfully",
        "session_id": new_session.id,
        "coach_feedback": ai_feedback
    }

# -------------------- Get Workout History --------------------
@app.get("/api/workouts")
def get_workouts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.WorkoutSession).filter(
        models.WorkoutSession.user_id == current_user.id
    ).order_by(models.WorkoutSession.date.desc()).limit(50).all()

    result = []
    for session in sessions:
        history = db.query(models.ExerciseHistory).filter(
            models.ExerciseHistory.session_id == session.id
        ).first()

        result.append({
            "id": session.id,
            "exercise": session.exercise_name,
            "reps": session.reps,
            "duration": f"{session.duration // 60}m {session.duration % 60}s" if session.duration else "0m 0s",
            "date": session.date.strftime("%Y-%m-%d %H:%M") if session.date else "-",
            "accuracy": round(history.accuracy, 1) if history else 0,
            "calories": history.calories_estimated if history else 0,
        })

    return result

# -------------------- AI Coach Feedback --------------------
@app.post("/api/coach-feedback")
def generate_coach_feedback(
    workout_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user)
):
    api_key = os.getenv("VIRTUALTRAINER_API_KEY") or os.environ.get("VIRTUALTRAINER_API_KEY")
    if not api_key:
        # Fallback local hardcoded feedback if no key is provided
        return {"feedback": f"Great job on your {workout_data.get('exercise', 'workout')}! You achieved {workout_data.get('accuracy', 0)}% accuracy. Keep pushing!"}

    # OpenRouter API call example (can also adapt to Gemini REST)
    try:
        prompt = f"Act as a professional virtual personal trainer. You are giving short, encouraging post-workout feedback to {current_user.username}. They just completed {workout_data.get('reps', 0)} reps of {workout_data.get('exercise', 'exercise')} with {workout_data.get('accuracy', 0)}% form accuracy, burning {workout_data.get('calories', 0)} calories. Give them 2-3 sentences of motivational and corrective advice. Be energetic."
        
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Virtual Trainer AI",
                "Content-Type": "application/json"
            },
            json={
                "model": "google/gemini-2.5-flash-free",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            ai_text = response.json()["choices"][0]["message"]["content"]
            return {"feedback": ai_text}
        else:
            return {"feedback": f"Great job on your {workout_data.get('exercise', 'workout')}! Keep up the good work."}
    except Exception as e:
        print(f"AI Coach Error: {e}")
        return {"feedback": "Awesome workout! Keep going strong tomorrow!"}

# -------------------- Pose Analysis (Image Upload) --------------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    joints = get_joint_landmarks(image)

    if joints is None:
        return {"status": "No body detected"}

    result = analyze_squat(joints)

    return {
        "status": "Body detected",
        "analysis": result
    }

# -------------------- Text-to-Speech Feedback --------------------
@app.post("/api/tts")
async def text_to_speech(data: dict = Body(...)):
    """
    Convert text feedback to speech audio.
    Request body: {"text": "string"}
    Returns: WAV audio file or error
    """
    text = data.get("text", "").strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Limit text length for safety
    if len(text) > 500:
        text = text[:500]
    
    try:
        import pyttsx3
        
        # Initialize text-to-speech engine
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)  # Speech rate
        engine.setProperty('volume', 1.0)  # Volume (0-1)
        
        # Use temporary file with proper cleanup
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
        
        try:
            engine.save_to_file(text, temp_path)
            engine.runAndWait()
            
            # Read the generated audio
            with open(temp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/wav",
                headers={"Content-Disposition": "attachment; filename=feedback.wav"}
            )
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")


# -------------------- Pose Analysis (Landmarks from Frontend) --------------------
@app.post("/analyze-landmarks")
async def analyze_landmarks(data: dict = Body(...)):
    landmarks = data.get("landmarks")

    if not landmarks:
        return {"error": "No landmarks received"}

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


# -------------------- Health Check --------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FitFlicks API is running"}
