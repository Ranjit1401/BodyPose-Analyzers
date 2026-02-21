import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Timer from "../components/Timer";
import { FaMicrophone } from "react-icons/fa";
import "../styles/Workout.css";
import SquatAnalyzer from "../SquatAnalyzer";

export default function Workout() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "squat";

  const videoRef = useRef(null);

  const [reps, setReps] = useState(10);
  const [speed, setSpeed] = useState(1);
  const [completedReps, setCompletedReps] = useState(0);
  const [caption, setCaption] = useState("Ready to start...");
  const [micActive, setMicActive] = useState(false);

  // 🎥 Handle demo video looping
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;

    const handleEnded = () => {
      if (completedReps + 1 < reps) {
        setCompletedReps((prev) => prev + 1);
        video.currentTime = 0;
        video.play();
      } else {
        setCaption("Workout Completed 🎉");
      }
    };

    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("ended", handleEnded);
    };
  }, [reps, speed, completedReps]);

  // 🎤 Mic toggle
  const toggleMic = () => {
    setMicActive(!micActive);
    setCaption(
      !micActive
        ? "Listening... Say 'start workout'"
        : "Mic turned off"
    );
  };

  return (
    <div className="workout-wrapper">

      {/* HEADER */}
      <div className="workout-header">
        {type.replaceAll("_", " ").toUpperCase()} SESSION
      </div>

      {/* GRID */}
      <div className="workout-grid">

        {/* AI CAMERA SECTION */}
        <div className="camera-section">
          <SquatAnalyzer />
        </div>

        {/* DEMO VIDEO */}
        <div className="video-section">
          <video
            ref={videoRef}
            src={`/videos/${type}.mp4`}
            controls
            className="exercise-video"
          />
        </div>

      </div>

      {/* CONTROLS */}
      <div className="controls-panel">

        <div className="controls-left">
          <label>
            Reps
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(e) => {
                setCompletedReps(0);
                setReps(Number(e.target.value));
              }}
            />
          </label>

          <label>
            Speed
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </label>
        </div>

        <div className="controls-center">
          <Timer initialSeconds={60} />
        </div>

        <div className="controls-right">
          <button
            className={`mic-btn ${micActive ? "active" : ""}`}
            onClick={toggleMic}
          >
            <FaMicrophone />
          </button>

          <div className="caption-box">
            {caption}
          </div>
        </div>

      </div>

    </div>
  );
}
