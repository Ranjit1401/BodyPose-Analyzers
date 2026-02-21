import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Register
export const registerUser = (data) => API.post("/register", data);

// Login
// Login
export const loginUser = (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);   // IMPORTANT
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
