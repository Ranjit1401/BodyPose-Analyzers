import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../styles/GlassNavbar.css";

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="glass-navbar">

      {/* LEFT - LOGO */}
      <div
        className="glass-logo"
        onClick={() => navigate("/home")}
        style={{ cursor: "pointer" }}
      >
        FitFlicks
      </div>

      {/* CENTER - NAV LINKS */}
      <div className="glass-links">
        <Link
          to="/home"
          className={isActive("/home") ? "active-link" : ""}
        >
          Home
        </Link>

        <Link
          to="/menu"
          className={isActive("/menu") ? "active-link" : ""}
        >
          Workouts
        </Link>

        <Link
          to="/history"
          className={isActive("/history") ? "active-link" : ""}
        >
          History
        </Link>
      </div>

      {/* RIGHT - PROFILE + SETTINGS + LOGOUT */}
      <div className="glass-actions">
        <div className="icon-btn" onClick={() => navigate("/profile")} title="Profile">
          <FiUser size={20} />
        </div>

        <div className="icon-btn" onClick={() => navigate("/settings")} title="Settings">
          <FiSettings size={20} />
        </div>

        {user && (
          <div className="icon-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={20} />
          </div>
        )}
      </div>

    </div>
  );
}
