import { useEffect, useRef, useState } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

function SquatAnalyzer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Initializing...");
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(async (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        // Draw skeleton
        drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });

        drawLandmarks(ctx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });

        // Send landmarks to backend
        sendToBackend(results.poseLandmarks);
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);

  const sendToBackend = async (landmarks) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-landmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ landmarks }),
      });

      const data = await response.json();

      if (data.analysis) {
        setReps(data.analysis.reps);
        setFeedback(data.analysis.feedback);
        setAngle(data.analysis.knee_angle);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ai-camera-wrapper">
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} className="ai-camera-video" />

      <div className="ai-stats">
        <p>Reps: {reps}</p>
        <p>Angle: {angle}</p>
        <p>{feedback}</p>
      </div>
    </div>
  );
}

export default SquatAnalyzer;
