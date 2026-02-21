import { useState, useEffect } from "react";
import "../styles/Workout.css"; // IMPORTANT

export default function Timer({ initialSeconds = 60 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  return (
    <div className="timer-container">

      <h2 className="timer-display">
        Time: {seconds}s
      </h2>

      <div className="timer-buttons">
        <button
          className="timer-btn"
          onClick={() => setIsActive(true)}
        >
          Start
        </button>

        <button
          className="timer-btn"
          onClick={() => setIsActive(false)}
        >
          Pause
        </button>

        <button
          className="timer-btn"
          onClick={() => {
            setIsActive(false);
            setSeconds(initialSeconds);
          }}
        >
          Reset
        </button>
      </div>

    </div>
  );
}
