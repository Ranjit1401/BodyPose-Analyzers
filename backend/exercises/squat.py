from pose.angles import calculate_angle

# Global state (temporary single-user logic)
counter = 0
stage = "waiting"   # waiting → up → down
previous_hip_y = None


def analyze_squat(joints):
    global counter
    global stage
    global previous_hip_y

    hip = joints["left_hip"]
    knee = joints["left_knee"]
    ankle = joints["left_ankle"]
    shoulder = joints["left_shoulder"]

    knee_angle = calculate_angle(hip, knee, ankle)
    back_angle = calculate_angle(shoulder, hip, knee)

    feedback = []

    # ---------------------------------------------------
    # 1️⃣ FULL BODY VISIBILITY CHECK
    # ---------------------------------------------------
    # If ankle not clearly below knee → probably cropped or sitting
    if ankle[1] < knee[1] + 0.03:
        return {
            "knee_angle": round(knee_angle, 2),
            "back_angle": round(back_angle, 2),
            "stage": stage,
            "reps": counter,
            "feedback": "Step back — full legs must be visible"
        }

# ---------------------------------------------------
# STRICT STANDING VALIDATION
# ---------------------------------------------------

# Hip must be clearly above knee
    if hip[1] >= knee[1] - 0.08:
        return {
            "knee_angle": round(knee_angle, 2),
            "back_angle": round(back_angle, 2),
            "stage": "waiting",
            "reps": counter,
            "feedback": "Stand fully upright before starting"
            }   

# Ankle must be clearly below knee
    if ankle[1] <= knee[1] + 0.05:
        return {
            "knee_angle": round(knee_angle, 2),
            "back_angle": round(back_angle, 2),
            "stage": "waiting",
            "reps": counter,
            "feedback": "Move back — full legs must be visible"
    }


    # ---------------------------------------------------
    # 3️⃣ INITIALIZE HIP MOVEMENT
    # ---------------------------------------------------
    if previous_hip_y is None:
        previous_hip_y = hip[1]

    hip_movement = abs(hip[1] - previous_hip_y)
    previous_hip_y = hip[1]

    # ---------------------------------------------------
    # 4️⃣ REP LOGIC
    # ---------------------------------------------------
    if knee_angle < 100 and stage in ["up", "waiting"] and hip_movement > 0.02:
        stage = "down"

    elif knee_angle > 165 and stage == "down" and hip_movement > 0.02:
        stage = "up"
        counter += 1

    # ---------------------------------------------------
    # 5️⃣ FORM CHECKS
    # ---------------------------------------------------

    # Back bending
    if back_angle < 155:
        feedback.append("Keep your back straight")

    # Not enough depth
    if stage == "down" and knee_angle > 100:
        feedback.append("Go lower")

    # Knee too forward
    if knee[0] > ankle[0] + 0.05:
        feedback.append("Keep knees behind toes")

    if not feedback:
        feedback.append("Good form!")

    return {
        "knee_angle": round(knee_angle, 2),
        "back_angle": round(back_angle, 2),
        "stage": stage,
        "reps": counter,
        "feedback": " | ".join(feedback)
    }
