-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    goal VARCHAR(100),

    total_workouts INTEGER DEFAULT 0,
    avg_accuracy INTEGER DEFAULT 0,
    total_calories INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,

    last_login_date DATE
);


-- WORKOUT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS workout_sessions (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    exercise VARCHAR(100),
    reps INTEGER,
    duration INTEGER,

    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    accuracy DOUBLE PRECISION,
    calories INTEGER,

    CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


-- EXERCISE HISTORY TABLE
CREATE TABLE IF NOT EXISTS exercise_history (
    id SERIAL PRIMARY KEY,

    session_id INTEGER NOT NULL,

    accuracy DOUBLE PRECISION,
    calories_estimated INTEGER,

    CONSTRAINT fk_session
    FOREIGN KEY(session_id)
    REFERENCES workout_sessions(id)
    ON DELETE CASCADE
);