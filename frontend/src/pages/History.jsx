import { useEffect, useState } from "react";
import { getWorkoutHistory } from "../services/api";
import "../styles/History.css";

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to view workout history");
          setLoading(false);
          return;
        }

        const response = await getWorkoutHistory();
        setWorkouts(response.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load workout history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getAccuracyClass = (accuracy) => {
    if (accuracy >= 95) return "high";
    if (accuracy >= 85) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div className="history-wrapper">
        <h1 className="history-title">Workout History</h1>
        <div className="loading-state">Loading your workouts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-wrapper">
        <h1 className="history-title">Workout History</h1>
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="history-wrapper">
      <h1 className="history-title">Workout History</h1>

      {workouts.length === 0 ? (
        <div className="empty-state">
          No workouts recorded yet. Start a workout to see your history!
        </div>
      ) : (
        <div className="history-table">
          <div className="history-header">
            <span>Exercise</span>
            <span>Date</span>
            <span>Accuracy</span>
            <span>Reps</span>
            <span>Calories</span>
            <span>Duration</span>
          </div>

          {workouts.map((workout) => (
            <div key={workout.id} className="history-row">
              <span>{workout.exercise}</span>
              <span>{workout.date}</span>

              <span
                className={`accuracy ${getAccuracyClass(
                  workout.accuracy
                )}`}
              >
                {workout.accuracy}%
              </span>

              <span>{workout.reps}</span>
              <span>{workout.calories} cal</span>
              <span>{workout.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
