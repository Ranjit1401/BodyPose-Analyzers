import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { saveWorkout } from "./services/api";

function ExerciseAnalyzer({ exerciseName = "Squats", type = "squats" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const poseState = useRef("UP");
    const lastTime = useRef(performance.now());
    const startTimeRef = useRef(null);

    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState("Initializing model...");
    const lastSpokenMessage = useRef("");
    const lastSpeakTime = useRef(0);
    const [stage, setStage] = useState("UP");
    const [score, setScore] = useState(100);
    const [fps, setFps] = useState(0);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Real-time metrics
    const [metrics, setMetrics] = useState({});

    const prevAngles = useRef({});

    const smoothAngle = (key, rawAngle, alpha = 0.5) => {
        if (!prevAngles.current[key]) {
            prevAngles.current[key] = rawAngle;
            return rawAngle;
        }
        const smoothed = alpha * rawAngle + (1 - alpha) * prevAngles.current[key];
        prevAngles.current[key] = smoothed;
        return smoothed;
    };

    const isVisible = (landmarks) => {
        return landmarks.every(lm => lm && lm.visibility > 0.65);
    };

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
                if (!isVisible([leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle])) {
                    message = "Adjust camera! Joints obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftKneeAngle = smoothAngle('leftKnee', calculateAngle(leftHip, leftKnee, leftAnkle));
                    const rightKneeAngle = smoothAngle('rightKnee', calculateAngle(rightHip, rightKnee, rightAnkle));
                    const backAngle = smoothAngle('backAngle', calculateAngle(leftShoulder, leftHip, leftAnkle));
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

                    if (avgAngle < 90 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                        message = "Great Depth! 🔥";
                    } else if (avgAngle > 160 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    } else if (avgAngle < 130 && poseState.current === "UP") {
                        message = "Go Lower ⬇️";
                    }
                }
            }

            // PUSHUPS / DIPS / CRUNCHES / ARM
            else if (lowerType.includes("pushup") || lowerType.includes("dips") || lowerType.includes("arm") || lowerType.includes("upper")) {
                if (!isVisible([leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist])) {
                    message = "Adjust camera! Arms obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftElbowAngle = smoothAngle('leftElbow', calculateAngle(leftShoulder, leftElbow, leftWrist));
                    const rightElbowAngle = smoothAngle('rightElbow', calculateAngle(rightShoulder, rightElbow, rightWrist));
                    const avgElbow = (leftElbowAngle + rightElbowAngle) / 2;

                    newMetrics = { "Elbow Angle": `${Math.round(avgElbow)}°` };

                    if (avgElbow < 90 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (avgElbow > 155 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    } else if (avgElbow < 130 && poseState.current === "UP") {
                        message = "Go Lower ⬇️";
                    }
                }
            }

            // LUNGES / SPLIT
            else if (lowerType.includes("lunge") || lowerType.includes("split")) {
                if (!isVisible([leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle])) {
                    message = "Adjust camera! Legs obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftKneeAngle = smoothAngle('leftKnee', calculateAngle(leftHip, leftKnee, leftAnkle));
                    const rightKneeAngle = smoothAngle('rightKnee', calculateAngle(rightHip, rightKnee, rightAnkle));

                    newMetrics = {
                        "L Knee": `${Math.round(leftKneeAngle)}°`,
                        "R Knee": `${Math.round(rightKneeAngle)}°`
                    };

                    if ((leftKneeAngle < 100 || rightKneeAngle < 100) && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (leftKneeAngle > 160 && rightKneeAngle > 160 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    }
                }
            }

            // PILATES (detect hip angle)
            else if (lowerType.includes("pilates")) {
                if (!isVisible([leftShoulder, leftHip, leftKnee])) {
                    message = "Adjust camera! Torso obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftHipAngle = smoothAngle('leftHip', calculateAngle(leftShoulder, leftHip, leftKnee));
                    newMetrics = { "Hip Angle": `${Math.round(leftHipAngle)}°` };

                    if (leftHipAngle < 90 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (leftHipAngle > 160 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    }
                }
            }

            // DUMBBELLS (detect shoulder movement)
            else if (lowerType.includes("dumbbell")) {
                if (!isVisible([leftHip, leftShoulder, leftElbow])) {
                    message = "Adjust camera! Shoulders obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftShoulderAngle = smoothAngle('leftShoulderDumbbell', calculateAngle(leftHip, leftShoulder, leftElbow));
                    newMetrics = { "Shoulder Angle": `${Math.round(leftShoulderAngle)}°` };

                    if (leftShoulderAngle > 140 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (leftShoulderAngle < 90 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    }
                }
            }

            // JUMPING JACKS / ZUMBA / CARDIO / RESISTANCE BAND
            else if (lowerType.includes("jack") || lowerType.includes("zumba") || lowerType.includes("cardio") || lowerType.includes("fat") || lowerType.includes("resistance")) {
                if (!isVisible([leftWrist, rightWrist, leftAnkle, rightAnkle])) {
                    message = "Adjust camera! Limbs obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const armDist = calculateDistance(leftWrist, rightWrist);
                    const legDist = calculateDistance(leftAnkle, rightAnkle);

                    if (armDist < 0.3 && legDist < 0.2 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (armDist > 0.6 && legDist > 0.4 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    }
                }
            }

            // DEFAULT (Fallback to Elbow)
            else {
                if (!isVisible([leftShoulder, leftElbow, leftWrist])) {
                    message = "Adjust camera! Arm obstructed ⚠️";
                    isCorrect = false;
                } else {
                    const leftElbowAngle = smoothAngle('leftElbow', calculateAngle(leftShoulder, leftElbow, leftWrist));
                    if (leftElbowAngle < 60 && poseState.current === "UP") {
                        poseState.current = "DOWN";
                        setStage("DOWN");
                    } else if (leftElbowAngle > 150 && poseState.current === "DOWN") {
                        currentReps++;
                        setReps(currentReps);
                        poseState.current = "UP";
                        setStage("UP");
                    }
                }
            }

            setScore(Math.max(0, formScore));
            setFeedback(message);
            setMetrics(newMetrics);

            // Text-to-Speech Guidance
            const nowTime = performance.now();
            if (
                message !== "Good Form ✅" &&
                message !== "Great Depth! 🔥" &&
                message !== lastSpokenMessage.current &&
                nowTime - lastSpeakTime.current > 3000
            ) {
                const speech = new SpeechSynthesisUtterance(message.replace(/[^\w\s']/gi, ''));
                speech.rate = 1.1;
                speech.pitch = 1;
                window.speechSynthesis.speak(speech);

                lastSpokenMessage.current = message;
                lastSpeakTime.current = nowTime;
            } else if (message === "Good Form ✅") {
                lastSpokenMessage.current = message;
            }

            drawConnectors(ctx, lm, POSE_CONNECTIONS, {
                color: isCorrect ? "#00ff88" : "#ff3c3c",
                lineWidth: 5,
            });
            drawLandmarks(ctx, lm, {
                color: "#ff0000",
                lineWidth: 2,
                radius: 3,
            });

        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current && videoRef.current.videoWidth > 0) {
                    await pose.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480,
        });

        camera.start();

        return () => {
            if (camera) {
                camera.stop();
            }
            if (pose) {
                pose.close();
            }
            window.speechSynthesis.cancel();
        };
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
            const res = await saveWorkout({
                exercise_name: exerciseName,
                reps: reps,
                duration: durationSec,
                accuracy: score,
                calories: estimatedCalories,
            });
            setSaved(true);
            setFeedback(res.data?.coach_feedback || "Workout Saved! ✅");

            // Speak the coach feedback
            if (res.data?.coach_feedback) {
                const speech = new SpeechSynthesisUtterance(res.data.coach_feedback.replace(/[^\w\s']/gi, ''));
                speech.rate = 1.05;
                window.speechSynthesis.speak(speech);
            }
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
                <div className={score > 70 ? "good" : "bad"} style={saved ? { fontSize: "1rem", lineHeight: "1.4", padding: "10px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "8px" } : {}}>
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
                    <div className="saved-badge">✅ Session Complete</div>
                )}
            </div>
        </div>
    );
}

export default ExerciseAnalyzer;
