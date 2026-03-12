import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def detect_landmarks(image):
    """Detect all 33 body landmarks with confidence and visibility scores."""
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark
    
    # Extract all 33 landmarks with x, y, z, visibility
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

def get_joint_landmarks(image):
    """Extract specifically named key joints for exercise analysis."""
    joints_full = detect_landmarks(image)
    
    if not joints_full:
        return None
    
    # Extract specific joints for backward compatibility
    return {
        "left_shoulder": (joints_full["left_shoulder"]["x"], joints_full["left_shoulder"]["y"]),
        "right_shoulder": (joints_full["right_shoulder"]["x"], joints_full["right_shoulder"]["y"]),
        "left_hip": (joints_full["left_hip"]["x"], joints_full["left_hip"]["y"]),
        "right_hip": (joints_full["right_hip"]["x"], joints_full["right_hip"]["y"]),
        "left_knee": (joints_full["left_knee"]["x"], joints_full["left_knee"]["y"]),
        "right_knee": (joints_full["right_knee"]["x"], joints_full["right_knee"]["y"]),
        "left_ankle": (joints_full["left_ankle"]["x"], joints_full["left_ankle"]["y"]),
        "right_ankle": (joints_full["right_ankle"]["x"], joints_full["right_ankle"]["y"]),
    }
