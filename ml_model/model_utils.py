"""
Model Utilities
Helper functions for the ML pose analysis pipeline.
"""

import numpy as np
import cv2


def preprocess_image(image, target_size=(640, 480)):
    """
    Preprocess image for pose detection.

    Args:
        image: Input BGR image
        target_size: Desired output size (width, height)

    Returns:
        Preprocessed image
    """
    if image is None:
        return None

    h, w = image.shape[:2]
    target_w, target_h = target_size

    # Maintain aspect ratio
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)

    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    # Pad to target size
    canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized

    return canvas


def normalize_landmarks(landmarks, image_width, image_height):
    """
    Convert normalized (0-1) landmarks to pixel coordinates.

    Args:
        landmarks: Dict of {name: (x, y, ...)}
        image_width: Image width in pixels
        image_height: Image height in pixels

    Returns:
        Dict with pixel coordinates
    """
    pixel_landmarks = {}
    for name, coords in landmarks.items():
        px = int(coords[0] * image_width)
        py = int(coords[1] * image_height)
        pixel_landmarks[name] = (px, py)
    return pixel_landmarks


def smooth_landmarks(current, previous, alpha=0.7):
    """
    Apply exponential smoothing to landmarks to reduce jitter.

    Args:
        current: Current frame landmarks
        previous: Previous frame landmarks
        alpha: Smoothing factor (0-1, higher = more smoothing)

    Returns:
        Smoothed landmarks
    """
    if previous is None:
        return current

    smoothed = {}
    for name in current:
        if name in previous:
            curr = np.array(current[name][:2])
            prev = np.array(previous[name][:2])
            result = alpha * prev + (1 - alpha) * curr
            smoothed[name] = tuple(result) + current[name][2:]
        else:
            smoothed[name] = current[name]

    return smoothed


def calculate_fps(prev_time, current_time):
    """Calculate frames per second."""
    dt = current_time - prev_time
    if dt > 0:
        return round(1.0 / dt)
    return 0
