-- FitFlicks Sample Seed Data
-- Note: Passwords are bcrypt hashed. The sample password is "password123"

-- Sample User (password: password123)
INSERT INTO users (username, email, password, goal, total_workouts, avg_accuracy, total_calories, streak)
VALUES (
    'Demo User',
    'demo@fitflicks.com',
    '$2b$12$LJ3m1EX1Dz.aCYBHwMFSUeKl0GhKjUqZqNj6YLQK7z6qzVpjqGOi',
    'Stay Fit',
    5,
    87.5,
    150,
    3
);

-- Sample Workout Sessions
INSERT INTO workout_sessions (user_id, exercise_name, reps, duration, date)
VALUES
    (1, 'Squats', 15, 120, datetime('now', '-5 days')),
    (1, 'Pushups', 20, 180, datetime('now', '-4 days')),
    (1, 'Squats', 12, 100, datetime('now', '-3 days')),
    (1, 'Burpees', 10, 150, datetime('now', '-2 days')),
    (1, 'Squats', 18, 140, datetime('now', '-1 days'));

-- Sample Exercise History
INSERT INTO exercise_history (session_id, accuracy, calories_estimated)
VALUES
    (1, 92.5, 30),
    (2, 85.0, 35),
    (3, 88.0, 25),
    (4, 80.0, 40),
    (5, 91.0, 32);
