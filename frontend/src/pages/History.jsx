import { useEffect, useState } from "react";
import "../styles/History.css";

export default function History() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    // TODO: Replace with your backend API call
    // Example:
    // fetch("/api/workouts")
    //   .then(res => res.json())
    //   .then(data => setWorkouts(data));

    setWorkouts([]); // remove this when backend connected
  }, []);

  const getAccuracyClass = (accuracy) => {
    if (accuracy >= 95) return "high";
    if (accuracy >= 85) return "medium";
    return "low";
  };

  return (
    <div className="history-wrapper">
      <h1 className="history-title">Workout History</h1>

      {workouts.length === 0 ? (
        <div className="empty-state">
          No workouts recorded yet.
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
              <span>{workout.calories}</span>
              <span>{workout.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
