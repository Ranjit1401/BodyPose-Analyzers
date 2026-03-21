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