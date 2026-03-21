import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

/* ─── ANGLE UTILITY ───────────────────────── */

function calcAngle(a, b, c) {
const rad =
Math.atan2(c.y - b.y, c.x - b.x) -
Math.atan2(a.y - b.y, a.x - b.x);

let angle = Math.abs((rad * 180) / Math.PI);
if (angle > 180) angle = 360 - angle;

return angle;
}

/* ─── SQUAT ANALYZER ─────────────────────── */

function analyzeSquat(lm, state) {

const lHip = lm[23], lKnee = lm[25], lAnkle = lm[27];
const rHip = lm[24], rKnee = lm[26], rAnkle = lm[28];
const shoulder = lm[11];

const leftKnee = calcAngle(lHip, lKnee, lAnkle);
const rightKnee = calcAngle(rHip, rKnee, rAnkle);
const backAngle = calcAngle(shoulder, lHip, lAnkle);

const avg = (leftKnee + rightKnee) / 2;

let feedback = "Perfect Form ✅";
let isCorrect = true;
let formScore = 100;
let countRep = false;

if (backAngle < 150) {
feedback = "Keep Back Straight ⚠️";
isCorrect = false;
formScore -= 25;
}

if (avg < 90) {
feedback = "Great Depth! 🔥";
} else if (avg < 130) {
feedback = "Go Lower ⬇️";
isCorrect = false;
formScore -= 20;
}

if (Math.abs(leftKnee - rightKnee) > 15) {
feedback = "Leg Imbalance ⚠️";
isCorrect = false;
formScore -= 15;
}

if (avg > 160 && state.current === "DOWN") {
state.current = "STANDING";
countRep = true;
} else if (avg < 100 && state.current === "STANDING") {
state.current = "DOWN";
} else if (avg > 160) {
state.current = "STANDING";
}

return {
feedback,
isCorrect,
formScore: Math.max(0, formScore),
countRep,
stage: state.current,
angles: {
"Left Knee": Math.round(leftKnee),
"Right Knee": Math.round(rightKnee),
"Back Angle": Math.round(backAngle),
},
highlightJoints: [lKnee, rKnee],
};
}

/* ─── ANALYZER MAP ───────────────────────── */

const ANALYZERS = {
squats: analyzeSquat
};

const EXERCISE_LABELS = {
squats: "🏋 Squat Analyzer"
};

/* ─── COMPONENT ───────────────────────── */

function SquatAnalyzer({ exerciseType = "squats", onRepsUpdate, onFeedbackUpdate }) {

const videoRef = useRef(null);
const canvasRef = useRef(null);
const exerciseState = useRef("STANDING");
const lastTime = useRef(performance.now());

const [reps, setReps] = useState(0);
const [feedback, setFeedback] = useState("Initializing...");
const [stage, setStage] = useState("STANDING");
const [score, setScore] = useState(100);
const [fps, setFps] = useState(0);
const [angles, setAngles] = useState({});

const normalizedType = exerciseType?.toLowerCase() || "squats";
const analyzer = ANALYZERS[normalizedType] || analyzeSquat;
const label = EXERCISE_LABELS[normalizedType] || "🏋 Exercise Analyzer";

/* RESET WHEN EXERCISE CHANGES */

useEffect(() => {

exerciseState.current = "STANDING";
setReps(0);
setFeedback("Initializing...");

}, [normalizedType]);

/* MEDIAPIPE SETUP */

useEffect(() => {

const pose = new Pose({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

pose.onResults((results) => {

  const now = performance.now();
  setFps(Math.round(1000 / (now - lastTime.current)));
  lastTime.current = now;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const width = videoRef.current?.videoWidth || 640;
  const height = videoRef.current?.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  if (!results.image) return;

  ctx.drawImage(results.image, 0, 0, width, height);

  if (!results.poseLandmarks) return;

  const lm = results.poseLandmarks;

  const result = analyzer(lm, exerciseState);

  /* REP DETECTION */

if (result.countRep) {

  setReps(prev => {

    const next = prev + 1;

    console.log("Rep detected:", next);

    if (onRepsUpdate) {
      onRepsUpdate(next);
    }

    return next;

  });

}

  setFeedback(result.feedback);
  setStage(result.stage);
  setScore(result.formScore);
  setAngles(result.angles || {});

  if (onFeedbackUpdate) {
    onFeedbackUpdate(result.feedback);
  }

  /* DRAW SKELETON */

  drawConnectors(ctx, lm, POSE_CONNECTIONS, {
    color: result.isCorrect ? "#00ff88" : "#ff3c3c",
    lineWidth: 4
  });

  drawLandmarks(ctx, lm, {
    color: "#ffffff",
    radius: 4
  });

});

if (!videoRef.current) return;

const camera = new Camera(videoRef.current, {

  onFrame: async () => {

    if (
      videoRef.current &&
      videoRef.current.videoWidth > 0 &&
      videoRef.current.videoHeight > 0
    ) {
      await pose.send({ image: videoRef.current });
    }

  },

  width: 640,
  height: 480

});

camera.start();

return () => {

  camera.stop();
  pose.close();

};

}, [normalizedType]);

/* UI */

return (

<div className="ai-camera-wrapper">

  <video ref={videoRef} style={{ display: "none" }} />

  <canvas ref={canvasRef} className="ai-camera-video" />

  <div className="ai-overlay">

    <h3>{label}</h3>

    <p>Reps: <strong>{reps}</strong></p>

    <p>Stage: {stage}</p>

    {Object.entries(angles).map(([k, v]) => (
      <p key={k}>{k}: {v}°</p>
    ))}

    <p>Form Score: <strong>{score}%</strong></p>

    <p>FPS: {fps}</p>

    <div className={score > 70 ? "feedback-good" : "feedback-bad"}>
      {feedback}
    </div>

  </div>

</div>

);

}

export default SquatAnalyzer;