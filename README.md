# 🏋️ FitFlicks — AI Body Pose Analyzer

A full-stack fitness web application that uses **AI-powered pose detection** to analyze exercise form, count repetitions, and track workout progress in real-time.

---

## ✨ Features

- **Real-Time Pose Detection** — MediaPipe-powered body landmark tracking via webcam
- **Exercise Analysis** — Squat form analysis with angle-based feedback
- **Rep Counting** — Automatic repetition counting using state machine logic
- **Posture Correction** — Real-time feedback on form (back alignment, depth, balance)
- **Workout History** — Save and review past workout sessions
- **User Dashboard** — Track total workouts, calories, accuracy, and streaks
- **Authentication** — Secure JWT-based login/registration with password reset
- **Multiple Exercises** — Squats, pushups, planks, yoga, zumba, and more
- **YouTube Import** — Load any YouTube exercise video alongside AI detection

---

## 🛠 Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | React 19, Vite, GSAP, Framer Motion   |
| Backend    | Python, FastAPI, SQLAlchemy            |
| Database   | SQLite (default) / PostgreSQL          |
| AI Model   | MediaPipe Pose (client + server)       |
| Auth       | JWT (python-jose), bcrypt              |

---

## 📁 Project Structure

```
BodyPose-Analyzers/
├── backend/                    # FastAPI Backend
│   ├── main.py                 # API endpoints
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── database.py             # Database configuration
│   ├── auth.py                 # JWT authentication
│   ├── email_config.py         # Email settings
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   ├── exercises/
│   │   └── squat.py            # Squat analysis logic
│   └── pose/
│       ├── detector.py         # MediaPipe pose detection
│       └── angles.py           # Angle calculation
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── pages/              # Landing, Home, Menu, Workout, History, Profile, Settings
│   │   ├── components/         # AuthModal, SquatAnalyzer, Navbar, etc.
│   │   ├── context/            # AuthContext, WorkoutContext
│   │   ├── services/           # Centralized API client
│   │   ├── api/                # Auth API functions
│   │   ├── styles/             # CSS files
│   │   └── SquatAnalyzer.jsx   # Client-side pose detection
│   ├── public/videos/          # Exercise video assets
│   └── package.json
│
├── ml_model/                   # ML Reference Implementations
│   ├── pose_detection.py       # MediaPipe wrapper
│   ├── angle_calculation.py    # Joint angle math
│   ├── exercise_counter.py     # Rep counter
│   ├── exercise_rules.py       # Exercise configurations
│   ├── model_utils.py          # Utility functions
│   └── camera_test.py          # Webcam test script
│
└── database/                   # SQL Files
    ├── schema.sql              # Table definitions
    └── seed_data.sql           # Sample data
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- A device with a **webcam**

### 1. Clone the Repository

```bash
git clone https://github.com/Ranjit1401/BodyPose-Analyzers.git
cd BodyPose-Analyzers
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

The API will be running at **http://localhost:8000**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at **http://localhost:5173**

---

## 📡 API Documentation

Once the backend is running, visit: **http://localhost:8000/docs** (Swagger UI)

### Key Endpoints

| Method | Endpoint              | Description                  | Auth |
|--------|----------------------|------------------------------|------|
| POST   | `/register`          | Register new user            | ❌   |
| POST   | `/login`             | Login (returns JWT)          | ❌   |
| GET    | `/me`                | Get current user info        | ✅   |
| GET    | `/api/profile`       | Get user profile + stats     | ✅   |
| PUT    | `/api/profile`       | Update profile (goal, name)  | ✅   |
| POST   | `/api/workouts`      | Save a workout session       | ✅   |
| GET    | `/api/workouts`      | Get workout history          | ✅   |
| POST   | `/analyze`           | Analyze uploaded image       | ❌   |
| POST   | `/analyze-landmarks` | Analyze pose landmarks       | ❌   |
| POST   | `/forgot-password`   | Send password reset email    | ❌   |
| POST   | `/reset-password`    | Reset password with token    | ❌   |
| GET    | `/health`            | Health check                 | ❌   |

---

## 🏃 User Flow

1. **Landing Page** → Click "Get Started" → Login or Register
2. **Home Page** → View features, FAQ → Click "Begin Training"
3. **Menu Page** → Select an exercise type
4. **Workout Page** → Webcam activates → AI detects pose → Rep counter runs
5. **Save Workout** → Click "Save Workout" to persist session data
6. **History Page** → View past workout sessions with accuracy and calories
7. **Profile Page** → See aggregate stats, streak, and activity heatmap
8. **Settings Page** → Update goal, toggle theme, logout

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./fitflicks.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
```

---

## 🧪 Testing the ML Model Locally

```bash
cd ml_model
python camera_test.py
```

This opens your webcam and runs real-time squat detection. Press `q` to quit.

---

## 👥 Contributors

- [Ranjit1401](https://github.com/Ranjit1401)

---

## 📄 License

This project is open source.
