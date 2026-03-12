"""
Robust Pose Analysis Module
Improved pose detection with handling for poor lighting and occlusion.
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class RobustPoseDetector:
    """Pose detector with robustness features for challenging conditions."""
    
    def __init__(self, model_complexity=1, min_detection_conf=0.5, min_tracking_conf=0.5):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            smooth_landmarks=True,
            min_detection_confidence=min_detection_conf,
            min_tracking_confidence=min_tracking_conf
        )
        # Landmark history for temporal smoothing
        self.landmark_history = deque(maxlen=5)
        self.confidence_threshold = min_detection_conf
        
    def detect(self, image):
        """Detect landmarks with robustness enhancements."""
        # Apply histogram equalization for poor lighting
        image_enhanced = self._enhance_image(image)
        image_rgb = cv2.cvtColor(image_enhanced, cv2.COLOR_BGR2RGB)
        
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return None, False
        
        # Check landmark confidence (visibility)
        landmarks = results.pose_landmarks.landmark
        avg_visibility = np.mean([lm.visibility for lm in landmarks])
        
        confidence_ok = avg_visibility >= self.confidence_threshold
        
        return results, confidence_ok
    
    def _enhance_image(self, image):
        """Enhance image for better detection in poor lighting."""
        # Convert to LAB for better contrast adjustment
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    def smooth_landmarks(self, landmarks):
        """Apply temporal smoothing across frames."""
        if landmarks:
            self.landmark_history.append(landmarks)
        
        if len(self.landmark_history) < 2:
            return landmarks
        
        # Average last 3-5 frames for stability
        smoothed = {}
        for key in landmarks:
            values = [frame.get(key) for frame in self.landmark_history if key in frame]
            if values:
                x = np.mean([v["x"] for v in values])
                y = np.mean([v["y"] for v in values])
                z = np.mean([v["z"] for v in values])
                visibility = np.mean([v["visibility"] for v in values])
                
                smoothed[key] = {
                    "x": x, "y": y, "z": z,
                    "visibility": visibility
                }
        
        return smoothed if smoothed else landmarks
    
    def filter_low_confidence_landmarks(self, landmarks, threshold=0.65):
        """Filter out low-confidence landmarks."""
        if not landmarks:
            return None
        
        high_conf = {
            key: lm for key, lm in landmarks.items()
            if lm.get("visibility", 0) >= threshold
        }
        
        return high_conf if high_conf else landmarks
    
    def extract_all_landmarks(self, results):
        """Extract all 33 landmarks with visibility scores."""
        if not results.pose_landmarks:
            return None
        
        landmarks = results.pose_landmarks.landmark
        joints = {}
        
        for idx, landmark_enum in enumerate(mp_pose.PoseLandmark):
            lm = landmarks[idx]
            joints[landmark_enum.name.lower()] = {
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility,
                "presence": getattr(lm, 'presence', lm.visibility)
            }
        
        return joints


def get_key_joints(landmarks):
    """Extract key joints from full landmarks for exercise analysis."""
    key_names = [
        "left_shoulder", "right_shoulder",
        "left_hip", "right_hip",
        "left_knee", "right_knee",
        "left_ankle", "right_ankle",
        "left_elbow", "right_elbow",
        "left_wrist", "right_wrist"
    ]
    
    return {key: landmarks[key] for key in key_names if key in landmarks}
