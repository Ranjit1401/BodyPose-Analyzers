# Setup Instructions for BodyPose-Analyzers (FitFlicks)

## Prerequisites
- Python 3.10+
- Node.js 18+
- Webcam/Camera device
- Optional: PostgreSQL for production database

## 1. Backend Setup

### Step 1: Navigate to backend directory
```bash
cd backend
```

### Step 2: Create virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure environment variables
Copy `.env.example` to `.env` and update values:
```bash
# Copy from root directory
cp ..\.env.example .env
```

Edit `.env`:
```env
SECRET_KEY=your-production-secret-key
DATABASE_URL=sqlite:///./fitflicks.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
VIRTUALTRAINER_API_KEY=your-api-key (optional, for AI Coach)
```

### Step 5: Initialize database
```bash
# Tables are auto-created on first run, or manually:
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

### Step 6: Start backend server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Backend API will be running at:** `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

## 2. Frontend Setup

### Step 1: Navigate to frontend directory
```bash
cd frontend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure environment variables (optional)
Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 4: Start development server
```bash
npm run dev
```

**Frontend will be running at:** `http://localhost:5173`

---

## 3. Testing Pose Detection Locally (Optional)

### Test with camera
```bash
cd ml_model
python camera_test.py
```

Press `q` to quit.

---

## 4. Project Structure

```
BodyPose-Analyzers/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic validators
│   ├── auth.py             # JWT authentication
│   ├── requirements.txt     # Python dependencies
│   ├── pose/               # Pose detection
│   │   ├── detector.py     # 33-landmark extraction
│   │   └── angles.py       # Angle calculations
│   ├── exercises/          # Exercise-specific logic
│   │   └── squat.py        # Squat analysis
│   └── .env               # Environment variables (create this)
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API client
│   │   ├── context/       # State management
│   │   ├── utils/         # Utilities (themeUtils.js)
│   │   ├── styles/        # CSS files
│   │   └── App.jsx        # Main app with theme init
│   └── package.json
│
├── ml_model/              # ML reference implementations
│   ├── pose_detection.py  # MediaPipe wrapper
│   ├── robust_pose.py     # Enhanced detection
│   ├── exercise_counter.py # Rep counter logic
│   ├── angle_calculation.py
│   └── camera_test.py     # Local testing
│
└── database/              # Database schemas
    ├── schema.sql
    └── seed_data.sql
```

---

## Key Features Implemented

### ✅ Pose Detection
- All 33 MediaPipe body landmarks
- Visibility & confidence filtering
- Robustness for poor lighting

### ✅ Rep Counter
- State machine: IDLE -> UP -> DOWN -> UP
- Hysteresis to prevent jitter
- Multi-frame smoothing (5+ frames)
- Confidence-based transitions

### ✅ Exercise Guidance
- Real-time angle monitoring
- Form correction feedback
- Support for: Squats, Pushups, Dumbbells, Pilates, etc.

### ✅ Voice Feedback
- Web Speech API (frontend)
- Backend TTS endpoint at `/api/tts`
- Markdown text cleaning

### ✅ Dark/Light Mode
- Persistent localStorage
- Applied on app initialization
- Smooth CSS transitions

### ✅ Environment Variables
- `.env.example` with all required variables
- SECRET_KEY, DATABASE_URL, Email config, API keys

### ✅ Robustness
- Image enhancement for poor lighting (CLAHE)
- Temporal smoothing across frames
- Low-confidence landmark filtering
- Visibility threshold >= 0.65

---

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login (returns JWT)
- `GET /me` - Current user info
- `POST /forgot-password` - Password reset
- `POST /reset-password` - Reset with token

### Workout
- `POST /api/workouts` - Save workout session
- `GET /api/workouts` - Get workout history
- `GET /api/profile` - Get user profile & stats
- `PUT /api/profile` - Update profile

### Analysis
- `POST /analyze` - Analyze uploaded image
- `POST /analyze-landmarks` - Analyze landmarks from frontend
- `POST /api/coach-feedback` - AI coach feedback (requires API key)
- `POST /api/tts` - Text-to-speech conversion

### Health
- `GET /health` - Health check

---

## Environment Variables Reference

Required:
- `SECRET_KEY` - JWT signing key (change in production!)
- `DATABASE_URL` - Database connection string

Optional (for email):
- `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_PORT`, `MAIL_SERVER`

Optional (for AI Coach):
- `VIRTUALTRAINER_API_KEY` - OpenRouter API key for Gemini chat

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check port 8000 is available
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Frontend build issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Camera not working
- Check browser permissions (allow camera access)
- Test with: `http://localhost:5173` in HTTPS or localhost
- Try different browser if one doesn't work

### TTS endpoint 502 error
- Ensure `pyttsx3` is installed: `pip install pyttsx3`
- Check `/tmp/speech.wav` exists (Linux/Mac)
- Windows: Replace `/tmp` path in code

### Database errors
- Delete `fitflicks.db` to reset: `rm backend/fitflicks.db`
- Tables auto-create on server start
- PostgreSQL: Update `DATABASE_URL` in `.env`

---

## Production Deployment

### Backend (example with Heroku)
```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Deploy
git push heroku main
```

### Frontend (example with Netlify)
```bash
npm run build
# Deploy `dist` folder to Netlify
```

### Important production steps:
1. Change `SECRET_KEY` to random string
2. Use PostgreSQL instead of SQLite
3. Enable HTTPS
4. Set proper CORS origins
5. Use environment variables for all secrets
6. Enable rate limiting

---

## Support & Contributing

For issues or improvements, open a GitHub issue at:
https://github.com/Ranjit1401/BodyPose-Analyzers

---

## License

MIT License - Open Source
