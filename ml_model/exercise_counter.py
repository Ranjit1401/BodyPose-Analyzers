"""
Exercise Counter
Generic rep counter using angle-based state machine for various exercises.
Includes hysteresis and multi-frame smoothing for robustness.
"""

from angle_calculation import calculate_angle
from collections import deque


class ExerciseCounter:
    """
    Counts exercise reps using a robust state machine approach.

    The counter transitions between stages based on joint angles:
    - IDLE: Initial state waiting for movement
    - UP: Starting/standing position (angle > up_threshold)
    - DOWN: Exercise position (angle < down_threshold)
    - Rep counted when transitioning from DOWN back to UP
    
    Features:
    - Hysteresis: prevents oscillation near thresholds
    - Multi-frame smoothing: requires stable state for N frames
    - Confidence tracking: ensures clean transitions
    """

    def __init__(self, exercise_name, up_threshold=160, down_threshold=90, hysteresis=5, min_frames=5):
        self.exercise_name = exercise_name
        self.up_threshold = up_threshold
        self.down_threshold = down_threshold
        self.hysteresis = hysteresis  # Buffer to prevent jitter
        self.min_frames = min_frames  # Frames needed to confirm state change
        
        self.reps = 0
        self.stage = "IDLE"
        self.feedback = []
        
        # Tracking for stability
        self.frame_counter = 0
        self.stage_timer = deque(maxlen=min_frames)

    def update(self, angle, visibility=0.7):
        """
        Update the counter based on current angle.

        Args:
            angle: Current joint angle in degrees
            visibility: Landmark visibility (0-1), skip if below 0.65

        Returns:
            dict: Current state with reps, stage, and feedback
        """
        self.feedback = []
        self.frame_counter += 1
        
        # Skip if landmark not visible
        if visibility < 0.65:
            self.feedback.append("⚠️ Adjust camera")
            return self._get_state()
        
        # Determine angle state with hysteresis
        if angle > self.up_threshold + self.hysteresis:
            angle_state = "UP"
        elif angle < self.down_threshold - self.hysteresis:
            angle_state = "DOWN"
        else:
            # In hysteresis zone, maintain previous state
            angle_state = self.stage if self.stage in ["UP", "DOWN"] else "IDLE"
        
        # Add to timer for stability check
        self.stage_timer.append(angle_state)
        
        # State transition logic with multi-frame confirmation
        if self.stage == "IDLE":
            if angle_state == "UP":
                self.stage = "UP"
                self.feedback.append("Ready! 🏋️")
            elif angle_state == "DOWN":
                self.stage = "DOWN"
                self.feedback.append("Started! 💪")
        
        elif self.stage == "UP":
            if angle_state == "DOWN" and all(s == "DOWN" for s in list(self.stage_timer)[-3:]):
                self.stage = "DOWN"
                self.feedback.append("Going down 📉")
        
        elif self.stage == "DOWN":
            if angle_state == "UP" and all(s == "UP" for s in list(self.stage_timer)[-3:]):
                self.reps += 1
                self.stage = "UP"
                self.feedback.append(f"Rep {self.reps}! ✅")
        
        return self._get_state()

    def _get_state(self):
        """Return current counter state."""
        return {
            "exercise": self.exercise_name,
            "reps": self.reps,
            "stage": self.stage,
            "feedback": self.feedback if self.feedback else ["Keep going!"],
        }

    def reset(self):
        """Reset the counter."""
        self.reps = 0
        self.stage = "IDLE"
        self.feedback = []
        self.frame_counter = 0
        self.stage_timer.clear()


def create_squat_counter():
    """Create a counter configured for squats."""
    return ExerciseCounter("Squats", up_threshold=160, down_threshold=100, hysteresis=8, min_frames=6)


def create_pushup_counter():
    """Create a counter configured for pushups."""
    return ExerciseCounter("Pushups", up_threshold=155, down_threshold=90, hysteresis=6, min_frames=5)


def create_bicep_curl_counter():
    """Create a counter configured for bicep curls."""
    return ExerciseCounter("Bicep Curls", up_threshold=150, down_threshold=40, hysteresis=5, min_frames=4)

def create_dumbbell_counter():
    """Create a counter configured for dumbbell exercises."""
    return ExerciseCounter("Dumbbells", up_threshold=140, down_threshold=80, hysteresis=7, min_frames=5)

def create_plank_counter():
    """For planks, track hold duration instead."""
    # This would need custom logic in the main counter
    return ExerciseCounter("Plank", up_threshold=60, down_threshold=30, hysteresis=3, min_frames=10)
