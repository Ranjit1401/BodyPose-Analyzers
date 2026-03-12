import { useEffect, useRef } from "react";

export default function PoseCamera() {
  const videoRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startCamera();
  }, []);

  return (
    <div className="camera-box">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="100%"
        height="100%"
      />
    </div>
  );
}
