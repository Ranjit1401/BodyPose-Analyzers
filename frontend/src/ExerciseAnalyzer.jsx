import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors } from "@mediapipe/drawing_utils";
import { saveWorkout } from "./services/api";

function ExerciseAnalyzer({ exerciseName = "Squats", type = "squats" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const poseState = useRef("UP");
    const lastTime = useRef(performance.now());
    const startTimeRef = useRef(null);

    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState("Initializing model...");
    const [stage, setStage] = useState("UP");
    const [score, setScore] = useState(100);
    const [fps, setFps] = useState(0);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Real-time metrics
    const [metrics, setMetrics] = useState({});

    const calculateAngle = (a, b, c) => {
        const radians =
            Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return angle;
    };

    const calculateDistance = (a, b) => {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    useEffect(() => {
        startTimeRef.current = Date.now();
        let currentReps = 0; // Local counter to avoid stale closure

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
            const ctx = canvas.getContext("2d");
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;
            canvas.width = width;
            canvas.height = height;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(results.image, 0, 0, width, height);

            if (!results.poseLandmarks) return;

            const lm = results.poseLandmarks;

            const leftShoulder = lm[11];
            const rightShoulder = lm[12];
            const leftElbow = lm[13];
            const rightElbow = lm[14];
            const leftWrist = lm[15];
            const rightWrist = lm[16];
            const leftHip = lm[23];
            const rightHip = lm[24];
            const leftKnee = lm[25];
            const rightKnee = lm[26];
            const leftAnkle = lm[27];
            const rightAnkle = lm[28];

            let isCorrect = true;
            let message = "Good Form ✅";
            let formScore = 100;
            let newMetrics = {};

            const lowerType = type.toLowerCase();

            // ================= EXERCISE LOGIC =================

            // SQUATS
            if (lowerType.includes("squat") || lowerType.includes("glutes") || lowerType.includes("thighs")) {
                const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
                const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
                const backAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
                const avgAngle = (leftKneeAngle + rightKneeAngle) / 2;

                newMetrics = { "Knee Angle": `${Math.round(avgAngle)}°` };

                if (Math.abs(leftHip.x - rightHip.x) > 0.1) {
                    message = "Turn Sideways";
                    isCorrect = false;
                } else if (backAngle < 150) {
                    message = "Keep Back Straight 🔙";
                    isCorrect = false;
                } else if (Math.abs(leftKneeAngle - rightKneeAngle) > 20) {
                    message = "Balance your weight ⚖️";
                    isCorrect = false;
                }

                if (avgAngle > 160) {
                    if (poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                    }
                    poseState.current = "UP";
                    setStage("UP");
                } else if (avgAngle < 100) {
                    poseState.current = "DOWN";
                    setStage("DOWN");
                    if (avgAngle < 90) message = "Great Depth! 🔥";
                } else if (avgAngle < 130 && poseState.current === "DOWN") {
                    message = "Go Lower ⬇️";
                }
            }

            // PUSHUPS / DIPS / CRUNCHES / ARM
            else if (lowerType.includes("pushup") || lowerType.includes("dips") || lowerType.includes("arm") || lowerType.includes("upper")) {
                const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
                const avgElbow = (leftElbowAngle + rightElbowAngle) / 2;

                newMetrics = { "Elbow Angle": `${Math.round(avgElbow)}°` };

                if (avgElbow > 155) {
                    if (poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                    }
                    poseState.current = "UP";
                    setStage("UP");
                } else if (avgElbow < 90) {
                    poseState.current = "DOWN";
                    setStage("DOWN");
                } else if (avgElbow < 130 && poseState.current === "DOWN") {
                    message = "Go Lower ⬇️";
                }
            }

            // LUNGES / SPLIT
            else if (lowerType.includes("lunge") || lowerType.includes("split")) {
                const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
                const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

                newMetrics = {
                    "L Knee": `${Math.round(leftKneeAngle)}°`,
                    "R Knee": `${Math.round(rightKneeAngle)}°`
                };

                if (leftKneeAngle > 160 && rightKneeAngle > 160) {
                    if (poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                    }
                    poseState.current = "UP";
                    setStage("UP");
                } else if (leftKneeAngle < 100 || rightKneeAngle < 100) {
                    poseState.current = "DOWN";
                    setStage("DOWN");
                }
            }

            // JUMPING JACKS / ZUMBA / CARDIO
            else if (lowerType.includes("jack") || lowerType.includes("zumba") || lowerType.includes("cardio") || lowerType.includes("fat")) {
                const armDist = calculateDistance(leftWrist, rightWrist);
                const legDist = calculateDistance(leftAnkle, rightAnkle);

                if (armDist < 0.3 && legDist < 0.2) {
                    poseState.current = "DOWN";
                    setStage("DOWN");
                } else if (armDist > 0.6 && legDist > 0.4 && poseState.current === "DOWN") {
                    poseState.current = "UP";
                    setStage("UP");
                    currentReps++;
                    setReps(currentReps);
                }
            }

            // DEFAULT (Bicep curls / unknown)
            else {
                const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                if (leftElbowAngle > 150) {
                    if (poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                    }
                    poseState.current = "UP";
                    setStage("UP");
                } else if (leftElbowAngle < 60) {
                    poseState.current = "DOWN";
                    setStage("DOWN");
                }
            }

            setScore(Math.max(0, formScore));
            setFeedback(message);
            setMetrics(newMetrics);

            drawConnectors(ctx, lm, POSE_CONNECTIONS, {
                color: isCorrect ? "#00ff88" : "#ff3c3c",
                lineWidth: 5,
            });

        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await pose.send({ image: videoRef.current });
            },
            width: 640,
            height: 480,
        });

        camera.start();
    }, [type]);

    const handleSaveWorkout = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setFeedback("Login to save workouts!");
            return;
        }

        setSaving(true);
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        const estimatedCalories = Math.round(reps * 7 + (durationSec / 60) * 5); // Base cal computation

        try {
            await saveWorkout({
                exercise_name: exerciseName,
                reps: reps,
                duration: durationSec,
                accuracy: score,
                calories: estimatedCalories,
            });
            setSaved(true);
            setFeedback("Workout Saved! ✅");
        } catch (error) {
            console.error("Failed to save workout:", error);
            setFeedback("Save failed ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ai-camera-wrapper">
            <video ref={videoRef} style={{ display: "none" }} />
            <canvas ref={canvasRef} className="ai-camera-video" />

            <div className="ai-overlay">
                <h3>🤖 AI Analysis</h3>
                <p>Type: <strong>{type.replace("_", " ")}</strong></p>
                <p>Reps: <strong style={{ color: "#00ff88", fontSize: "1.2rem" }}>{reps}</strong></p>
                <p>Stage: {stage}</p>

                {Object.entries(metrics).map(([key, val]) => (
                    <p key={key}>{key}: {val}</p>
                ))}

                <p>Form: <strong>{score}%</strong></p>
                <div className={score > 70 ? "good" : "bad"}>
                    {feedback}
                </div>

                {reps > 0 && !saved && (
                    <button
                        className="save-workout-btn"
                        onClick={handleSaveWorkout}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "💾 Save Workout"}
                    </button>
                )}

                {saved && (
                    <div className="saved-badge">✅ Saved Session!</div>
                )}
            </div>
        </div>
    );
}

export default ExerciseAnalyzer;
