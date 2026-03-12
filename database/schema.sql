-- FitFlicks Database Schema
-- SQLite Compatible

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    goal TEXT DEFAULT 'Not Set',
    total_workouts INTEGER DEFAULT 0,
    avg_accuracy REAL DEFAULT 0.0,
    total_calories INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_login_date DATE
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    reps INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    accuracy REAL DEFAULT 0.0,
    calories_estimated INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_history_session ON exercise_history(session_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
