import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Automatically attach auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            // Optionally redirect to login
        }
        return Promise.reject(error);
    }
);

// -------------------- Auth --------------------
export const registerUser = (data) => api.post("/register", data);

export const loginUser = (data) => {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);
    return api.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
};

export const forgotPassword = (data) => api.post("/forgot-password", data);
export const resetPassword = (data) => api.post("/reset-password", data);

// -------------------- Profile --------------------
export const getProfile = () => api.get("/api/profile");
export const updateProfile = (data) => api.put("/api/profile", data);
export const getCurrentUser = () => api.get("/me");

// -------------------- Workouts --------------------
export const saveWorkout = (data) => api.post("/api/workouts", data);
export const getWorkoutHistory = () => api.get("/api/workouts");

// -------------------- Pose Analysis --------------------
export const analyzeLandmarks = (landmarks) =>
    api.post("/analyze-landmarks", { landmarks });

export default api;
