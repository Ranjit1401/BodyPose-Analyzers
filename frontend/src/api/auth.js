import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register
export const registerUser = (data) => API.post("/register", data);

// Login
export const loginUser = (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  return API.post("/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

// Forgot Password
export const forgotPassword = (data) =>
  API.post("/forgot-password", data);

// Reset Password
export const resetPassword = (data) =>
  API.post("/reset-password", data);
