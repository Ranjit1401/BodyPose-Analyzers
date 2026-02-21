import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Timer from "../components/Timer";
import { FaMicrophone } from "react-icons/fa";
import "../styles/Workout.css";
import SquatAnalyzer from "../SquatAnalyzer";

export default function Workout() {

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "running_in_place";

  const videoRef = useRef(null);

  /* ================= EXERCISE MAP (MOVE HERE) ================= */

  const exerciseMap = {
    dumbbells: [
      { label: "360 Rotation", file: "360.mp4" },
      { label: "Dumbbell Lunge", file: "dumbbell_Lunge.mp4" },
      { label: "Glutes", file: "glutes.mp4" },
      { label: "Massive Arm", file: "massive_arm.mp4" }
    ],

    pilates: [
      { label: "Bench Dips", file: "Bench_Dips.mp4" },
      { label: "Bulgarian Split", file: "Bulgarian_Split.mp4" },
      { label: "Goal Post", file: "Goal_post.mp4" },
      { label: "Oblique Exercise", file: "Oblique_exercise.mp4" },
      { label: "Crunches", file: "crunches.mp4" },
      { label: "Wall Workout", file: "wall_workout.mp4" }
    ],

    pushups: [
      { label: "Standard Pushups", file: "pushups.mp4" },
      { label: "Knee Pushups", file: "knee_pushups.mp4" }
    ],

    resistance_band: [
      { label: "Thighs", file: "Thighs.mp4" },
      { label: "Side", file: "side.mp4" },
      { label: "Upper Body", file: "upper.mp4" },
      { label: "Upper Body 2", file: "upper2.mp4" }
    ],

    zumba: [
      { label: "3 Min", file: "3min.mp4" },
      { label: "4 Min Tabata", file: "4min_Tabata.mp4" },
      { label: "Arm Slow Workout", file: "Arm_slow_workout.mp4" },
      { label: "Beginner", file: "Begineer.mp4" },
      { label: "Dura", file: "Dura.mp4" },
      { label: "Fat Burning", file: "Fat_burning.mp4" },
      { label: "Crazy", file: "crazy.mp4" }
    ]
  };

  /* ================= STATES ================= */

  const [variationIndex, setVariationIndex] = useState(0);
  const [reps, setReps] = useState(10);
  const [speed, setSpeed] = useState(1);
  const [completedReps, setCompletedReps] = useState(0);
  const [caption, setCaption] = useState("Ready to start...");
  const [micActive, setMicActive] = useState(false);

  // 🎥 Handle video looping based on reps
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

  // 🎤 Fake mic toggle
  const toggleMic = () => {
    setMicActive(!micActive);
    setCaption(
      !micActive
        ? "Listening... Say 'start workout'"
        : "Mic turned off"
    );
  };

  /* ================= VIDEO SOURCE ================= */

  const videoSrc = exerciseMap[type]
    ? `/videos/${type}/${exerciseMap[type][variationIndex].file}`
    : `/videos/${type}.mp4`;

  return (
    <div className="workout-wrapper">

      <div className="workout-header">
        {type.replaceAll("_", " ").toUpperCase()} SESSION
      </div>

      <div className="workout-grid">

        {/* CAMERA */}
        <div className="camera-section">
          <SquatAnalyzer />
        </div>

        {/* VIDEO */}
        <div className="video-section">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            className="exercise-video"
          />
        </div>

      </div>

      <div className="controls-panel">

        <div className="controls-left">

          {exerciseMap[type] && (
            <label>
              Variation
              <select
                value={variationIndex}
                onChange={(e) =>
                  setVariationIndex(Number(e.target.value))
                }
              >
                {exerciseMap[type].map((item, index) => (
                  <option key={index} value={index}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          )}

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