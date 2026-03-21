import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Timer from "../components/Timer";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import "../styles/Workout.css";
import SquatAnalyzer from "../SquatAnalyzer";

/* ================= POSE EXERCISES ================= */

const POSE_EXERCISES = new Set([
"squats",
"pushup",
"pushups",
"planks",
"plank",
"burpees"
]);

/* ================= TEXT TO SPEECH ================= */

const lastSpokenRef = { text: "", time: 0 };

function speakText(text, rate = 1) {

if (!window.speechSynthesis) return;

const now = Date.now();

if (lastSpokenRef.text === text && now - lastSpokenRef.time < 4000) return;

lastSpokenRef.text = text;
lastSpokenRef.time = now;

window.speechSynthesis.cancel();

const utter = new SpeechSynthesisUtterance(text);
utter.rate = rate;
utter.lang = "en-US";

window.speechSynthesis.speak(utter);

}

/* ================= COMPONENT ================= */

export default function Workout() {

const [searchParams] = useSearchParams();
const type = (searchParams.get("type") || "running_in_place").toLowerCase();

const videoRef = useRef(null);

/* ================= STATES ================= */

const [variationIndex, setVariationIndex] = useState(0);
const [reps, setReps] = useState(5);
const [speed, setSpeed] = useState(1);
const [completedReps, setCompletedReps] = useState(0);

const [micActive, setMicActive] = useState(false);
const [userSpeech, setUserSpeech] = useState("");
const [aiText, setAiText] = useState("Ready to start...");
const [isListening, setIsListening] = useState(false);

const [elapsedSeconds, setElapsedSeconds] = useState(0);

const lastFeedbackRef = useRef("");
const poseRepCount = useRef(0);

const savedRef = useRef(false);

const recognitionRef = useRef(null);
const shouldListenRef = useRef(false);

/* ================= EXERCISE MAP ================= */

const exerciseMap = {

pushup: [
  { label: "Standard Pushups", file: "pushups.mp4" },
  { label: "Knee Pushups", file: "knee_pushups.mp4" }
],

pilates: [
  { label: "Crunches", file: "crunches.mp4" },
  { label: "Wall Workout", file: "wall_workout.mp4" }
]

};

/* ================= FEEDBACK ================= */

const handleFeedbackUpdate = useCallback((msg) => {

if (msg && msg !== lastFeedbackRef.current) {

  lastFeedbackRef.current = msg;
  setAiText(msg);
  speakText(msg);

}

}, []);

/* ================= SAVE SESSION ================= */

const saveSession = useCallback(async (durationSec) => {

const token = localStorage.getItem("token");

if (!token) {

  console.warn("No token found");
  return;

}

const payload = {

  exercise: type,
  reps: poseRepCount.current,
  accuracy: 80,
  duration: durationSec

};

console.log("Saving workout:", payload);

try {

  const res = await fetch("http://localhost:8000/api/session", {

    method: "POST",

    headers: {

      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`

    },

    body: JSON.stringify(payload)

  });

  const data = await res.json();

  console.log("Workout saved:", data);

} catch (err) {

  console.error("Save failed:", err);

}

}, [type]);

/* ================= REP COUNT ================= */

const handleRepsUpdate = useCallback((count) => {

console.log("Reps update received:", count);

poseRepCount.current = count;

if (count >= reps && !savedRef.current) {

  savedRef.current = true;

  console.log("Workout completed → saving session");

  setAiText("Workout Completed 🎉");

  speakText("Workout completed. Great job!");

  setTimeout(() => {

    saveSession(elapsedSeconds);

  }, 500);

}

}, [reps, elapsedSeconds, saveSession]);

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

  setAiText("Speech recognition not supported");
  return;

}

const recognition = new SpeechRecognition();

recognition.lang = "en-US";

recognition.onstart = () => setIsListening(true);

recognition.onresult = (event) => {

  const transcript = event.results[0][0].transcript;

  setUserSpeech(transcript);

  if (transcript.toLowerCase().includes("start")) {

    speakText("Starting workout");

  }

  if (transcript.toLowerCase().includes("stop")) {

    speakText("Stopping workout");

  }

};

recognition.onend = () => setIsListening(false);

recognition.start();

recognitionRef.current = recognition;

}, []);

const toggleMic = () => {

if (micActive) {

  stopRecognition();

} else {

  setMicActive(true);
  shouldListenRef.current = true;
  startRecognition();

}

};

/* ================= CLEANUP ================= */

useEffect(() => {

return () => {

  stopRecognition();
  window.speechSynthesis?.cancel();

};

}, []);

/* ================= TIMER ================= */

const handleTimerTick = (secs) => {

setElapsedSeconds(secs);

};

/* ================= SAVE ON PAGE EXIT ================= */

useEffect(() => {

const handleLeaveWorkout = () => {

  const repsDone = poseRepCount.current || completedReps;

  if (repsDone > 0 && !savedRef.current) {

    savedRef.current = true;
    saveSession(elapsedSeconds);

  }

};

window.addEventListener("beforeunload", handleLeaveWorkout);

return () => {

  handleLeaveWorkout();
  window.removeEventListener("beforeunload", handleLeaveWorkout);

};

}, [completedReps, elapsedSeconds, saveSession]);

/* ================= VIDEO LOOP ================= */

useEffect(() => {

const video = videoRef.current;

if (!video) return;

video.playbackRate = speed;

const handleEnded = () => {

  if (completedReps + 1 < reps) {

    setCompletedReps(prev => prev + 1);
    video.currentTime = 0;
    video.play();

  }

  else {

    setAiText("Workout Completed 🎉");
    speakText("Workout completed");

    if (!savedRef.current) {

      savedRef.current = true;
      saveSession(elapsedSeconds);

    }

  }

};

video.addEventListener("ended", handleEnded);

return () => video.removeEventListener("ended", handleEnded);

}, [reps, speed, completedReps, elapsedSeconds, saveSession]);

/* ================= RESET SESSION ================= */

useEffect(() => {

setCompletedReps(0);
savedRef.current = false;

if (videoRef.current)
  videoRef.current.currentTime = 0;

}, [variationIndex]);

/* ================= VIDEO SOURCE ================= */

const videoSrc = exerciseMap[type]
? `/videos/${type}/${exerciseMap[type][variationIndex].file}`
: `/videos/${type}.mp4`;

const isPoseExercise = POSE_EXERCISES.has(type);

/* ================= UI ================= */

return (

<div className="workout-wrapper">

  <div className="workout-header">

    {type.replaceAll("_", " ").toUpperCase()} SESSION

  </div>

  <div className="workout-grid">

    <div className="camera-section">

      {isPoseExercise ? (

        <SquatAnalyzer
          exerciseType={type}
          onRepsUpdate={handleRepsUpdate}
          onFeedbackUpdate={handleFeedbackUpdate}
        />

      ) : (

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

      <button
        className={`mic-btn ${micActive ? "active" : ""}`}
        onClick={toggleMic}
      >

        {micActive ? <FaMicrophone /> : <FaMicrophoneSlash />}

      </button>

      <div className="caption-box">

        {isListening && <div>🎙 Listening...</div>}

        {userSpeech && <div>You: {userSpeech}</div>}

        <div>{aiText}</div>

      </div>

    </div>

  </div>

</div>

);

}