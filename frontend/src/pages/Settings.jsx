import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/api";
import "../styles/Settings.css";

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [goal, setGoal] = useState("");
    const [username, setUsername] = useState("");
    const [theme, setTheme] = useState("dark");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("appTheme") || "dark";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
        document.body.classList.toggle("light-mode", savedTheme === "light");
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getProfile();
                setGoal(response.data.user.goal || "");
                setUsername(response.data.user.name || "");
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            await updateProfile({ goal, username });
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Failed to save settings");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("appTheme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        document.body.classList.toggle("light-mode", newTheme === "light");
    };

    if (loading) {
        return (
            <div className="settings-wrapper">
                <h1 className="settings-title">Settings</h1>
                <div className="loading-state">Loading...</div>
            </div>
        );
    }

    return (
        <div className="settings-wrapper">
            <h1 className="settings-title">Settings</h1>

            {message && <div className="settings-message">{message}</div>}

            <div className="settings-sections">
                {/* Profile Section */}
                <section className="settings-section">
                    <h2>Profile</h2>

                    <div className="settings-field">
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="settings-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="disabled"
                        />
                    </div>

                    <div className="settings-field">
                        <label>Fitness Goal</label>
                        <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                            <option value="Not Set">Select a goal</option>
                            <option value="Lose Weight">Lose Weight</option>
                            <option value="Build Muscle">Build Muscle</option>
                            <option value="Stay Fit">Stay Fit</option>
                            <option value="Improve Flexibility">Improve Flexibility</option>
                            <option value="Increase Endurance">Increase Endurance</option>
                        </select>
                    </div>

                    <button className="save-btn" onClick={handleSave}>
                        Save Changes
                    </button>
                </section>

                {/* Appearance Section */}
                <section className="settings-section">
                    <h2>Appearance</h2>

                    <div className="settings-field toggle-field">
                        <label>Theme</label>
                        <div className="theme-toggle" onClick={toggleTheme}>
                            <div className={`toggle-track ${theme}`}>
                                <div className="toggle-thumb" />
                            </div>
                            <span>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="settings-section danger-section">
                    <h2>Account</h2>

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </section>
            </div>
        </div>
    );
}

