import { useState, useEffect, useRef } from "react";
import "../styles/Workout.css"; // IMPORTANT

export default function Timer({ initialSeconds = 60 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const endTimeRef = useRef(null);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + seconds * 1000;
      }

      interval = setInterval(() => {
        const timeRemaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSeconds(timeRemaining);
        if (timeRemaining === 0) {
          setIsActive(false);
          endTimeRef.current = null;
        }
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const handleStart = () => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setIsActive(true);
  };

  const handlePause = () => {
    endTimeRef.current = null;
    setIsActive(false);
  };

  const handleReset = () => {
    endTimeRef.current = null;
    setIsActive(false);
    setSeconds(initialSeconds);
  };

  return (
    <div className="timer-container">

      <h2 className="timer-display">
        Time: {seconds}s
      </h2>

      <div className="timer-buttons">
        <button
          className="timer-btn"
          onClick={handleStart}
        >
          Start
        </button>

        <button
          className="timer-btn"
          onClick={handlePause}
        >
          Pause
        </button>

        <button
          className="timer-btn"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

    </div>
  );
}
