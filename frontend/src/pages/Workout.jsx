import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Timer from "../components/Timer";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import "../styles/Workout.css";
import SquatAnalyzer from "../SquatAnalyzer";

// ─── POSE-BASED EXERCISES (use the SquatAnalyzer per-exercise detection) ─────
const POSE_EXERCISES = new Set(["squats", "pushup", "pushups", "planks", "plank", "burpees"]);

// ─── TTS HELPER ───────────────────────────────────────────────────────────────
const lastSpokenRef = { text: "", time: 0 };

function speakText(text, rate = 1) {
  if (!window.speechSynthesis) return;
  const now = Date.now();
  // Avoid repeating the same message within 5 seconds
  if (lastSpokenRef.text === text && now - lastSpokenRef.time < 5000) return;
  lastSpokenRef.text = text;
  lastSpokenRef.time = now;

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.lang = "en-US";
  window.speechSynthesis.speak(utter);
}

export default function Workout() {

  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") || "running_in_place").toLowerCase();

  const videoRef = useRef(null);

  /* ================= EXERCISE MAP ================= */

  const exerciseMap = {
    dumbbells: [
      { label: "360 Rotation", file: "360.mp4" },
      { label: "Dumbbell Lunges", file: "Dumbbell_Lunge.mp4" },
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

    pushup: [
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
  const [reps, setReps] = useState(5);               // ← DEFAULT: 5 (was 10)
  const [speed, setSpeed] = useState(1);
  const [completedReps, setCompletedReps] = useState(0);

  // Mic / STT states
  const [micActive, setMicActive] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");  // green
  const [aiText, setAiText] = useState("Ready to start..."); // red
  const [isListening, setIsListening] = useState(false);

  // Duration tracking (from timer)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // AI feedback from pose analyzer
  const lastFeedbackRef = useRef("");
  const poseRepCount    = useRef(0);

  // YouTube import
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  // Speech recognition refs
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  /* ================= TTS: pose feedback ================= */
  const handleFeedbackUpdate = useCallback((msg) => {
    if (msg && msg !== lastFeedbackRef.current) {
      lastFeedbackRef.current = msg;
      setAiText(msg);
      speakText(msg);
    }
  }, []);

  const handleRepsUpdate = useCallback((count) => {
    poseRepCount.current = count;
    speakText(`Rep ${count} complete! Keep going!`);
  }, []);

  /* ================= SPEECH RECOGNITION ================= */

  const stopRecognition = useCallback(() => {
    shouldListenRef.current = false;
    setMicActive(false);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiText("Speech recognition not supported in this browser.");
      speakText("Speech recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false; // we restart manually for reliability

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      setUserSpeech(transcript);

      // Simple command handler
      const lower = transcript.toLowerCase();
      if (lower.includes("start")) {
        setAiText("Starting your workout!");
        speakText("Starting your workout!");
      } else if (lower.includes("stop") || lower.includes("pause")) {
        setAiText("Pausing workout.");
        speakText("Pausing workout.");
      } else if (lower.includes("reset")) {
        setAiText("Resetting workout.");
        speakText("Resetting workout.");
      } else {
        // Echo + encourage
        setAiText(`Got it: "${transcript}". Keep pushing! 💪`);
        speakText(`Got it! Keep pushing!`);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "audio-capture") {
        // Silently restart
      } else if (event.error === "not-allowed") {
        setAiText("Microphone access denied. Please allow mic permission.");
        speakText("Microphone access denied.");
        stopRecognition();
        return;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if mic is still enabled
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) startRecognition();
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("Recognition start error:", e);
    }
  }, [stopRecognition]);

  const toggleMic = useCallback(() => {
    if (micActive) {
      stopRecognition();
      setUserSpeech("");
      setAiText("Mic turned off.");
    } else {
      setMicActive(true);
      shouldListenRef.current = true;
      startRecognition();
    }
  }, [micActive, startRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
      window.speechSynthesis?.cancel();
    };
  }, [stopRecognition]);

  /* ================= SAVE SESSION TO BACKEND ================= */

  const saveSession = useCallback(async (durationSec) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch("http://localhost:8000/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise: type,
          reps: poseRepCount.current || completedReps,
          accuracy: 80,                          // default approximation
          duration: durationSec,
        }),
      });
    } catch (err) {
      console.warn("Session save failed:", err);
    }
  }, [type, completedReps]);

  const handleTimerTick = useCallback((secs) => {
    setElapsedSeconds(secs);
  }, []);

  /* ================= VIDEO LOOP ================= */

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
        setAiText("Workout Completed 🎉");
        speakText("Great job! Workout completed!");
        saveSession(elapsedSeconds);
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);

  }, [reps, speed, completedReps, elapsedSeconds, saveSession]);

  useEffect(() => {
    setCompletedReps(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [variationIndex]);

  /* ================= YOUTUBE IMPORT ROUTE ================= */

  const extractVideoId = (url) => {
    const regExp = /(?:youtube\.com\/(?:.*v=|embed\/|v\/)|youtu\.be\/)([^#&?]*)/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  if (type === "import") {
    return (
      <div className="workout-wrapper">
        {!videoId ? (
          <div className="setup-card">
            <h2>Import Exercise From YouTube</h2>

            <input
              type="text"
              placeholder="Paste YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="youtube-input"
            />

            <button
              className="primary-btn"
              onClick={() => {
                const id = extractVideoId(youtubeUrl);
                if (id) setVideoId(id);
                else alert("Invalid YouTube URL");
              }}
            >
              Load Video
            </button>
          </div>
        ) : (
          <div className="workout-grid">
            <div className="camera-section">
              <SquatAnalyzer exerciseType="squats" />
            </div>

            <div className="video-section">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube player"
                allowFullScreen
                className="exercise-video"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================= NORMAL VIDEO SOURCE ================= */

  const videoSrc = exerciseMap[type]
    ? `/videos/${type}/${exerciseMap[type][variationIndex].file}`
    : `/videos/${type}.mp4`;

  const isPoseExercise = POSE_EXERCISES.has(type);

  return (
    <div className="workout-wrapper">

      <div className="workout-header">
        {type.replaceAll("_", " ").toUpperCase()} SESSION
      </div>

      <div className="workout-grid">

        <div className="camera-section">
          {isPoseExercise ? (
            /* Pose-based exercises: pass the type and callbacks */
            <SquatAnalyzer
              exerciseType={type}
              onRepsUpdate={handleRepsUpdate}
              onFeedbackUpdate={handleFeedbackUpdate}
            />
          ) : (
            /* Other exercises: generic animated camera view */
            <SquatAnalyzer exerciseType="squats" />
          )}
        </div>

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
                onChange={(e) => setVariationIndex(Number(e.target.value))}
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
          <Timer onTick={handleTimerTick} />
        </div>

        <div className="controls-right">
          {/* MIC BUTTON */}
          <button
            id="mic-toggle-btn"
            className={`mic-btn ${micActive ? "active" : ""}`}
            onClick={toggleMic}
            title={micActive ? "Stop Listening" : "Start Listening"}
          >
            {micActive ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>

          {/* CAPTION / SPEECH DISPLAY */}
          <div className="caption-box">
            {isListening && (
              <div className="listening-indicator">🎙 Listening...</div>
            )}
            {userSpeech && (
              <div className="speech-user">You: {userSpeech}</div>
            )}
            <div className="speech-ai">{aiText}</div>
          </div>

        </div>

      </div>

    </div>
  );
}