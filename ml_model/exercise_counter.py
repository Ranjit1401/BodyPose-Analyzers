"""
Exercise Counter
Generic rep counter using angle-based state machine for various exercises.
"""

from angle_calculation import calculate_angle


class ExerciseCounter:
    """
    Counts exercise reps using a state machine approach.

    The counter transitions between stages based on joint angles:
    - UP: Starting/standing position (angle > up_threshold)
    - DOWN: Exercise position (angle < down_threshold)
    - Rep counted when transitioning from DOWN back to UP
    """

    def __init__(self, exercise_name, up_threshold=160, down_threshold=90):
        self.exercise_name = exercise_name
        self.up_threshold = up_threshold
        self.down_threshold = down_threshold
        self.reps = 0
        self.stage = "UP"
        self.feedback = []

    def update(self, angle):
        """
        Update the counter based on current angle.

        Args:
            angle: Current joint angle in degrees

        Returns:
            dict: Current state with reps, stage, and feedback
        """
        self.feedback = []

        if angle > self.up_threshold:
            if self.stage == "DOWN":
                self.reps += 1
                self.feedback.append("Rep completed! ✅")
            self.stage = "UP"

        elif angle < self.down_threshold:
            self.stage = "DOWN"

        return {
            "exercise": self.exercise_name,
            "reps": self.reps,
            "stage": self.stage,
            "current_angle": round(angle, 1),
            "feedback": self.feedback if self.feedback else ["Keep going!"],
        }

    def reset(self):
        """Reset the counter."""
        self.reps = 0
        self.stage = "UP"
        self.feedback = []


def create_squat_counter():
    """Create a counter configured for squats."""
    return ExerciseCounter("Squats", up_threshold=160, down_threshold=100)


def create_pushup_counter():
    """Create a counter configured for pushups."""
    return ExerciseCounter("Pushups", up_threshold=155, down_threshold=90)


def create_bicep_curl_counter():
    """Create a counter configured for bicep curls."""
    return ExerciseCounter("Bicep Curls", up_threshold=150, down_threshold=40)
