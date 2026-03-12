import { createContext, useContext, useState, useRef } from "react";
import { saveWorkout } from "../services/api";

const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
    const [currentExercise, setCurrentExercise] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [reps, setReps] = useState(0);
    const [duration, setDuration] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const timerRef = useRef(null);

    const startWorkout = (exerciseName) => {
        setCurrentExercise(exerciseName);
        setIsActive(true);
        setReps(0);
        setDuration(0);
        setAccuracy(100);

        // Start duration timer
        timerRef.current = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);
    };

    const endWorkout = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsActive(false);

        // Estimate calories (rough: ~0.5 cal per rep for bodyweight exercises)
        const estimatedCalories = Math.round(reps * 5 + (duration / 60) * 3);

        const workoutData = {
            exercise_name: currentExercise || "Unknown",
            reps,
            duration,
            accuracy: Math.round(accuracy),
            calories: estimatedCalories,
        };

        try {
            const token = localStorage.getItem("token");
            if (token) {
                await saveWorkout(workoutData);
                return { success: true, data: workoutData };
            }
            return { success: false, message: "Not logged in" };
        } catch (error) {
            console.error("Failed to save workout:", error);
            return { success: false, message: "Failed to save" };
        }
    };

    const updateReps = (newReps) => setReps(newReps);
    const updateAccuracy = (newAccuracy) => setAccuracy(newAccuracy);

    return (
        <WorkoutContext.Provider
            value={{
                currentExercise,
                isActive,
                reps,
                duration,
                accuracy,
                startWorkout,
                endWorkout,
                updateReps,
                updateAccuracy,
            }}
        >
            {children}
        </WorkoutContext.Provider>
    );
}

export function useWorkout() {
    return useContext(WorkoutContext);
}
