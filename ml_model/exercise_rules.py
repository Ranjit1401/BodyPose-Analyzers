"""
Exercise Rules
Defines angle thresholds, joint mappings, and form rules for each exercise type.
"""

from angle_calculation import calculate_angle


EXERCISE_RULES = {
    "squats": {
        "primary_angle": {
            "joints": ["left_hip", "left_knee", "left_ankle"],
            "up_threshold": 160,
            "down_threshold": 100,
        },
        "form_checks": [
            {
                "name": "back_angle",
                "joints": ["left_shoulder", "left_hip", "left_knee"],
                "min_angle": 155,
                "feedback": "Keep your back straight",
            },
            {
                "name": "knee_over_toe",
                "check": "knee_forward",
                "feedback": "Keep knees behind toes",
            },
        ],
        "calories_per_rep": 0.32,
    },
    "pushups": {
        "primary_angle": {
            "joints": ["left_shoulder", "left_elbow", "left_wrist"],
            "up_threshold": 155,
            "down_threshold": 90,
        },
        "form_checks": [
            {
                "name": "body_alignment",
                "joints": ["left_shoulder", "left_hip", "left_ankle"],
                "min_angle": 160,
                "feedback": "Keep your body in a straight line",
            },
        ],
        "calories_per_rep": 0.36,
    },
    "bicep_curls": {
        "primary_angle": {
            "joints": ["left_shoulder", "left_elbow", "left_wrist"],
            "up_threshold": 150,
            "down_threshold": 40,
        },
        "form_checks": [
            {
                "name": "elbow_position",
                "joints": ["left_shoulder", "left_elbow", "left_hip"],
                "min_angle": 5,
                "max_angle": 25,
                "feedback": "Keep elbows close to your body",
            },
        ],
        "calories_per_rep": 0.15,
    },
    "jumping_jacks": {
        "primary_angle": {
            "joints": ["left_hip", "left_shoulder", "left_wrist"],
            "up_threshold": 150,
            "down_threshold": 30,
        },
        "form_checks": [],
        "calories_per_rep": 0.20,
    },
}


def get_exercise_config(exercise_name):
    """Get the configuration for a given exercise."""
    key = exercise_name.lower().replace(" ", "_")
    return EXERCISE_RULES.get(key, EXERCISE_RULES["squats"])


def check_form(joints, exercise_name):
    """
    Check exercise form based on rules.

    Args:
        joints: Dict of joint positions {name: (x, y)}
        exercise_name: Name of the exercise

    Returns:
        list: Form feedback messages
    """
    config = get_exercise_config(exercise_name)
    feedback = []

    for check in config.get("form_checks", []):
        if "joints" in check and "min_angle" in check:
            try:
                joint_names = check["joints"]
                a = joints.get(joint_names[0])
                b = joints.get(joint_names[1])
                c = joints.get(joint_names[2])

                if a and b and c:
                    angle = calculate_angle(a, b, c)
                    if angle < check["min_angle"]:
                        feedback.append(check["feedback"])
            except (KeyError, IndexError):
                pass

    if not feedback:
        feedback.append("Good form!")

    return feedback


def estimate_calories(exercise_name, reps):
    """Estimate calories burned based on exercise and rep count."""
    config = get_exercise_config(exercise_name)
    cal_per_rep = config.get("calories_per_rep", 0.3)
    return round(reps * cal_per_rep * 10)  # Rough estimation
