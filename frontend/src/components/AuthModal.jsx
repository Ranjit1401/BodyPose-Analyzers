import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthModal.css";
import {
  registerUser,
  loginUser,
  forgotPassword,
} from "../api/auth";

export default function AuthModal({ close }) {
  const [view, setView] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error

  const navigate = useNavigate();
  const { login } = useAuth();

  // Clear message when switching views
  const changeView = (newView) => {
    setMessage("");
    setMessageType("");
    setView(newView);
  };

  // 🔐 LOGIN HANDLER
  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }

    try {
      const response = await loginUser({ email, password });

      const token = response.data.access_token;
      localStorage.setItem("token", token);

      setMessage("Login successful!");
      setMessageType("success");

      login(email);
      navigate("/home");

    } catch (error) {
      setMessage(error.response?.data?.detail || "Login failed");
      setMessageType("error");
    }
  };

  // 📝 REGISTER HANDLER
  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }

    try {
      await registerUser({
        username: fullName,
        email,
        password,
      });

      setMessage("Registration successful!");
      setMessageType("success");

      // Auto login
      const response = await loginUser({ email, password });
      const token = response.data.access_token;

      localStorage.setItem("token", token);
      login(email);
      navigate("/home");

    } catch (error) {
      setMessage(error.response?.data?.detail || "Registration failed");
      setMessageType("error");
    }
  };

  // 🔁 FORGOT PASSWORD
  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Enter your email");
      setMessageType("error");
      return;
    }

    try {
      const response = await forgotPassword({ email });

      setMessage(response.data.message || "Reset link sent!");
      setMessageType("success");

      changeView("login");

    } catch (error) {
      setMessage(error.response?.data?.detail || "Error sending reset link");
      setMessageType("error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="auth-card">

        <h2 className="brand-name">FitFlicks</h2>

        {/* MESSAGE DISPLAY */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {view === "forgot" && (
          <span
            className="back-arrow"
            onClick={() => changeView("login")}
          >
            ← Back
          </span>
        )}

        {/* LOGIN VIEW */}
        {view === "login" && (
          <>
            <h3>Login</h3>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p
              className="forgot"
              onClick={() => changeView("forgot")}
            >
              Forgot Password?
            </p>

            <button
              className="auth-btn secondary-btn"
              onClick={handleLogin}
            >
              Login
            </button>

            <p className="toggle-text">
              Don't have an account?
              <span onClick={() => changeView("register")}>
                {" "}Register
              </span>
            </p>
          </>
        )}

        {/* REGISTER VIEW */}
        {view === "register" && (
          <>
            <h3>Register</h3>

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="auth-btn secondary-btn"
              onClick={handleRegister}
            >
              Register
            </button>

            <p className="toggle-text">
              Already have an account?
              <span onClick={() => changeView("login")}>
                {" "}Login
              </span>
            </p>
          </>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === "forgot" && (
          <>
            <h3>Reset Password</h3>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className="auth-btn secondary-btn"
              onClick={handleForgotPassword}
            >
              Send Reset Link
            </button>
          </>
        )}

        <p
          className="skip"
          onClick={() => navigate("/home")}
        >
          Skip
        </p>

      </div>
    </div>
  );
}
