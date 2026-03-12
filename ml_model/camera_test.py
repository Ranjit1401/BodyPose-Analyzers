"""
Camera Test Script
Run this to test webcam pose detection locally.

Usage:
    python camera_test.py
"""

import cv2
import time
from pose_detection import init_pose, detect_pose, extract_landmarks, draw_landmarks
from angle_calculation import calculate_angle
from exercise_counter import create_squat_counter


def main():
    print("=" * 50)
    print("  FitFlicks - Camera Pose Detection Test")
    print("=" * 50)
    print("\nStarting webcam... Press 'q' to quit.\n")

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Cannot open webcam!")
        return

    pose = init_pose(static_mode=False, complexity=1)
    counter = create_squat_counter()
    prev_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flip horizontally for mirror view
        frame = cv2.flip(frame, 1)

        # Detect pose
        results = detect_pose(frame, pose)
        joints = extract_landmarks(results)

        # Draw landmarks
        frame = draw_landmarks(frame, results)

        # Calculate FPS
        current_time = time.time()
        fps = int(1 / (current_time - prev_time + 1e-6))
        prev_time = current_time

        if joints:
            # Calculate knee angle for squats
            knee_angle = calculate_angle(
                joints["left_hip"],
                joints["left_knee"],
                joints["left_ankle"]
            )

            # Update counter
            state = counter.update(knee_angle)

            # Display info on frame
            h, w, _ = frame.shape
            cv2.putText(frame, f"Reps: {state['reps']}", (10, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 136), 3)
            cv2.putText(frame, f"Stage: {state['stage']}", (10, 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, f"Angle: {state['current_angle']}°", (10, 115),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            cv2.putText(frame, f"FPS: {fps}", (w - 120, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            # Feedback
            for i, fb in enumerate(state["feedback"]):
                cv2.putText(frame, fb, (10, 150 + i * 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)
        else:
            cv2.putText(frame, "No body detected", (10, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(frame, f"FPS: {fps}", (frame.shape[1] - 120, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("FitFlicks - Pose Detection Test", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSession ended. Total reps: {counter.reps}")


if __name__ == "__main__":
    main()
