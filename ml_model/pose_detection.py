"""
Pose Detection Module
Uses MediaPipe Pose to detect body landmarks from webcam or image input.
"""

import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def init_pose(static_mode=False, complexity=1, min_detection=0.5, min_tracking=0.5):
    """Initialize MediaPipe Pose model."""
    return mp_pose.Pose(
        static_image_mode=static_mode,
        model_complexity=complexity,
        smooth_landmarks=True,
        min_detection_confidence=min_detection,
        min_tracking_confidence=min_tracking,
    )


def detect_pose(image, pose_model):
    """
    Detect pose landmarks in an image.

    Args:
        image: BGR image (numpy array)
        pose_model: MediaPipe Pose instance

    Returns:
        results: MediaPipe pose results with landmarks
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_rgb.flags.writeable = False
    results = pose_model.process(image_rgb)
    image_rgb.flags.writeable = True
    return results


def extract_landmarks(results):
    """
    Extract body landmark coordinates from pose results.

    Returns:
        dict: Named joint positions {name: (x, y, z, visibility)}
        None: If no landmarks detected
    """
    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark

    joint_names = {
        "nose": mp_pose.PoseLandmark.NOSE,
        "left_shoulder": mp_pose.PoseLandmark.LEFT_SHOULDER,
        "right_shoulder": mp_pose.PoseLandmark.RIGHT_SHOULDER,
        "left_elbow": mp_pose.PoseLandmark.LEFT_ELBOW,
        "right_elbow": mp_pose.PoseLandmark.RIGHT_ELBOW,
        "left_wrist": mp_pose.PoseLandmark.LEFT_WRIST,
        "right_wrist": mp_pose.PoseLandmark.RIGHT_WRIST,
        "left_hip": mp_pose.PoseLandmark.LEFT_HIP,
        "right_hip": mp_pose.PoseLandmark.RIGHT_HIP,
        "left_knee": mp_pose.PoseLandmark.LEFT_KNEE,
        "right_knee": mp_pose.PoseLandmark.RIGHT_KNEE,
        "left_ankle": mp_pose.PoseLandmark.LEFT_ANKLE,
        "right_ankle": mp_pose.PoseLandmark.RIGHT_ANKLE,
    }

    joints = {}
    for name, landmark_id in joint_names.items():
        lm = landmarks[landmark_id.value]
        joints[name] = (lm.x, lm.y, lm.z, lm.visibility)

    return joints


def draw_landmarks(image, results):
    """Draw pose landmarks and connections on the image."""
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 136), thickness=2, circle_radius=3),
            mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2),
        )
    return image
