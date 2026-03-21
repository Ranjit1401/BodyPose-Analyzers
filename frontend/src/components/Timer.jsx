import { useState, useEffect, useRef } from "react";
import "../styles/Workout.css";

export default function Timer({ onTick }) {

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const intervalRef = useRef(null);

  // timer loop
  useEffect(() => {

    if (isActive) {

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

    } else {

      clearInterval(intervalRef.current);

    }

    return () => clearInterval(intervalRef.current);

  }, [isActive]);

  // notify parent safely
  useEffect(() => {

    if (onTick) {
      onTick(seconds);
    }

  }, [seconds, onTick]);

  const formatTime = (s) => {

    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");

    return `${mm}:${ss}`;

  };

  const handleReset = () => {

    setIsActive(false);
    setSeconds(0);

    if (onTick) onTick(0);
  };

  return (

    <div className="timer-container">

      <h2 className="timer-display">⏱ {formatTime(seconds)}</h2>

      <div className="timer-buttons">

        <button
          className="timer-btn"
          onClick={() => setIsActive(true)}
          disabled={isActive}
        >
          Start
        </button>

        <button
          className="timer-btn"
          onClick={() => setIsActive(false)}
          disabled={!isActive}
        >
          Pause
        </button>

        <button className="timer-btn" onClick={handleReset}>
          Reset
        </button>

      </div>

    </div>
  );
}
