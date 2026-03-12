<div className="ai-camera-wrapper">

  <canvas ref={canvasRef} className="ai-camera-video" />

  <div className="ai-stats">
    <h3>🏆 Squat Analyzer</h3>
    <p>Reps: {counter}</p>
    <p>Stage: {stage}</p>
    <p>Left Knee: {leftKneeAngle}°</p>
    <p>Right Knee: {rightKneeAngle}°</p>
    <p>Hip Angle: {hipAngle}°</p>
    <p>Back Angle: {backAngle}°</p>
    <p>Form Score: {formScore}%</p>
    <p>FPS: {fps}</p>
  </div>

</div>