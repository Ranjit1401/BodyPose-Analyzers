"""
Angle Calculation Utilities
Computes angles between body joints for exercise analysis.
"""

import numpy as np


def calculate_angle(point_a, point_b, point_c):
    """
    Calculate the angle at point_b formed by points a-b-c.

    Args:
        point_a: Tuple (x, y) or (x, y, z)
        point_b: Tuple (x, y) or (x, y, z) - vertex point
        point_c: Tuple (x, y) or (x, y, z)

    Returns:
        float: Angle in degrees (0-180)
    """
    a = np.array(point_a[:2])
    b = np.array(point_b[:2])
    c = np.array(point_c[:2])

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.arccos(cosine_angle)

    return np.degrees(angle)


def calculate_distance(point_a, point_b):
    """Calculate Euclidean distance between two points."""
    a = np.array(point_a[:2])
    b = np.array(point_b[:2])
    return np.linalg.norm(a - b)


def is_aligned(point_a, point_b, threshold=0.05):
    """Check if two points are vertically aligned (within threshold)."""
    return abs(point_a[0] - point_b[0]) < threshold
