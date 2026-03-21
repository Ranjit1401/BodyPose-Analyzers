import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

// ─── ANGLE UTIL ──────────────────────────────────────────────────────────────
function calcAngle(a, b, c) {
  const rad =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((rad * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// ─── PER-EXERCISE ANALYZERS ───────────────────────────────────────────────────

function analyzeSquat(lm, state) {
  const lHip = lm[23], lKnee = lm[25], lAnkle = lm[27];
  const rHip = lm[24], rKnee = lm[26], rAnkle = lm[28];
  const shoulder = lm[11];

  const leftKnee  = calcAngle(lHip, lKnee, lAnkle);
  const rightKnee = calcAngle(rHip, rKnee, rAnkle);
  const backAng   = calcAngle(shoulder, lHip, lAnkle);
  const avg       = (leftKnee + rightKnee) / 2;

  let feedback = "Perfect Form ✅";
  let isCorrect = true;
  let formScore = 100;
  let countRep = false;

  // Back alignment
  if (backAng < 150) { feedback = "Keep Back Straight ⚠️"; isCorrect = false; formScore -= 25; }
  // Depth check
  if (avg < 90)        { feedback = "Great Depth! 🔥"; }
  else if (avg < 130)  { feedback = "Go Lower ⬇️"; isCorrect = false; formScore -= 20; }
  // Imbalance
  if (Math.abs(leftKnee - rightKnee) > 15) { feedback = "Leg Imbalance ⚠️"; isCorrect = false; formScore -= 15; }

  // State machine: STANDING → DOWN → STANDING = 1 rep
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
      "Back Angle": Math.round(backAng),
    },
    highlightJoints: [lKnee, rKnee],
  };
}

function analyzePushup(lm, state) {
  const lShoulder = lm[11], lElbow = lm[13], lWrist = lm[15];
  const rShoulder = lm[12], rElbow = lm[14], rWrist = lm[16];
  const lHip = lm[23], rHip = lm[24];
  const lAnkle = lm[27], rAnkle = lm[28];

  const leftElbow  = calcAngle(lShoulder, lElbow, lWrist);
  const rightElbow = calcAngle(rShoulder, rElbow, rWrist);
  const bodyLine   = calcAngle(lShoulder, lHip, lAnkle);
  const avg        = (leftElbow + rightElbow) / 2;

  let feedback = "Perfect Form ✅";
  let isCorrect = true;
  let formScore = 100;
  let countRep = false;

  // Body alignment (should be ~170-180°)
  if (bodyLine < 155) { feedback = "Keep Body Straight ⚠️"; isCorrect = false; formScore -= 20; }
  if (bodyLine > 185) { feedback = "Lower Your Hips ⬇️"; isCorrect = false; formScore -= 15; }

  // Depth
  if (avg < 90)       { feedback = "Great Depth! 🔥"; }
  else if (avg < 130) { feedback = "Go Lower ⬇️"; isCorrect = false; formScore -= 20; }

  // State machine: UP → DOWN → UP = 1 rep
  if (avg > 160 && state.current === "DOWN") {
    state.current = "UP";
    countRep = true;
  } else if (avg < 90 && state.current !== "DOWN") {
    state.current = "DOWN";
  } else if (avg > 160 && state.current !== "DOWN") {
    state.current = "UP";
  }

  return {
    feedback,
    isCorrect,
    formScore: Math.max(0, formScore),
    countRep,
    stage: state.current,
    angles: {
      "Left Elbow":  Math.round(leftElbow),
      "Right Elbow": Math.round(rightElbow),
      "Body Line":   Math.round(bodyLine),
    },
    highlightJoints: [lElbow, rElbow],
  };
}

function analyzePlank(lm, state) {
  const lShoulder = lm[11], lHip = lm[23], lAnkle = lm[27];

  const bodyLine = calcAngle(lShoulder, lHip, lAnkle);

  let feedback = "Hold It! Great Plank 💪";
  let isCorrect = true;
  let formScore = 100;

  if (bodyLine < 150) { feedback = "Raise Your Hips ⬆️"; isCorrect = false; formScore -= 30; }
  else if (bodyLine > 185) { feedback = "Lower Your Hips ⬇️"; isCorrect = false; formScore -= 20; }

  // No rep counting for plank — timer based
  state.current = "PLANK";

  return {
    feedback,
    isCorrect,
    formScore: Math.max(0, formScore),
    countRep: false,
    stage: "PLANK",
    angles: { "Body Alignment": Math.round(bodyLine) },
    highlightJoints: [lHip],
  };
}

function analyzeBurpee(lm, state) {
  // Burpee = squat → plank (jump down) → pushup (optional) → jump up
  // Detect via hip height + knee angle
  const lHip  = lm[23], lKnee = lm[25], lAnkle = lm[27];
  const rHip  = lm[24], rKnee = lm[26], rAnkle = lm[28];
  const lShoulder = lm[11];

  const avgKnee = (calcAngle(lHip, lKnee, lAnkle) + calcAngle(rHip, rKnee, rAnkle)) / 2;
  // Hip Y position (MediaPipe normalizes 0=top, 1=bottom)
  const hipHeight = (lHip.y + rHip.y) / 2;
  const shoulderHeight = lShoulder.y;

  let feedback = "Follow the Range 🔁";
  let isCorrect = true;
  let formScore = 100;
  let countRep = false;

  // Simple state machine for burpee phases
  // STAND: hips high, knees extended (> 150°)
  // DOWN: hips low (plank/squat) — knees bent or body flat
  // JUMP: hips rise again above threshold

  if (avgKnee > 155 && hipHeight < 0.6) {
    // Standing / jumping up
    if (state.current === "DOWN") {
      state.current = "STANDING";
      countRep = true;
      feedback = "Rep Done! 🎉";
    } else {
      state.current = "STANDING";
      feedback = "Standing – Go Down! ⬇️";
    }
  } else if (avgKnee < 100 || hipHeight > 0.7) {
    // Squat/plank position
    if (state.current === "STANDING") {
      state.current = "DOWN";
    }
    feedback = avgKnee < 100 ? "Good Squat Depth! 🔥" : "Plank Position! 💪";
  }

  return {
    feedback,
    isCorrect,
    formScore: Math.max(0, formScore),
    countRep,
    stage: state.current,
    angles: {
      "Avg Knee": Math.round(avgKnee),
      "Hip Height": Math.round(hipHeight * 100) + "%",
    },
    highlightJoints: [lKnee, lHip],
  };
}

// ─── EXERCISE DETECTOR MAP ────────────────────────────────────────────────────
const ANALYZERS = {
  squats:         analyzeSquat,
  pushup:         analyzePushup,
  pushups:        analyzePushup,
  planks:         analyzePlank,
  plank:          analyzePlank,
  burpees:        analyzeBurpee,
};

const EXERCISE_LABELS = {
  squats: "🏋 Squat Analyzer",
  pushup: "💪 Push-Up Analyzer",
  pushups: "💪 Push-Up Analyzer",
  planks: "🧘 Plank Analyzer",
  plank: "🧘 Plank Analyzer",
  burpees: "🔥 Burpee Analyzer",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
function SquatAnalyzer({ exerciseType = "squats", onRepsUpdate, onFeedbackUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const exerciseState = useRef("STANDING");
  const lastTime = useRef(performance.now());

  const [reps, setReps]           = useState(0);
  const [feedback, setFeedback]   = useState("Initializing...");
  const [stage, setStage]         = useState("STANDING");
  const [score, setScore]         = useState(100);
  const [fps, setFps]             = useState(0);
  const [angles, setAngles]       = useState({});

  const normalizedType = exerciseType?.toLowerCase() || "squats";
  const analyzer = ANALYZERS[normalizedType] || analyzeSquat;
  const label = EXERCISE_LABELS[normalizedType] || "🏋 Exercise Analyzer";

  useEffect(() => {
    exerciseState.current = "STANDING";
    setReps(0);
    setFeedback("Initializing...");
  }, [normalizedType]);

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults((results) => {
      const now = performance.now();
      setFps(Math.round(1000 / (now - lastTime.current)));
      lastTime.current = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const width  = videoRef.current?.videoWidth  || 640;
      const height = videoRef.current?.videoHeight || 480;
      canvas.width  = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      if (!results.poseLandmarks) return;
      const lm = results.poseLandmarks;

      // Run the exercise-specific analyzer
      const result = analyzer(lm, exerciseState);

      if (result.countRep) {
        setReps((prev) => {
          const next = prev + 1;
          if (onRepsUpdate) onRepsUpdate(next);
          return next;
        });
      }

      setFeedback(result.feedback);
      setStage(result.stage);
      setScore(result.formScore);
      setAngles(result.angles || {});

      if (onFeedbackUpdate) onFeedbackUpdate(result.feedback);

      // Draw skeleton
      drawConnectors(ctx, lm, POSE_CONNECTIONS, {
        color: result.isCorrect ? "#00ff88" : "#ff3c3c",
        lineWidth: 4,
      });

      drawLandmarks(ctx, lm, {
        color: "#ffffff",
        lineWidth: 1,
        radius: 4,
      });

      // Angle labels on highlighted joints
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "yellow";
      (result.highlightJoints || []).forEach((joint, i) => {
        const entries = Object.entries(result.angles || {});
        if (entries[i]) {
          ctx.fillText(
            `${entries[i][1]}`,
            joint.x * width + 8,
            joint.y * height - 8
          );
        }
      });
    });

    if (!videoRef.current) return;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop?.();
      pose.close?.();
    };
  }, [normalizedType]);

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