import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import Aurora from "../components/Aurora";
import "../styles/Landing.css";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openLogin) {
      setShowAuthModal(true);
    }
  }, [location.state]);

  const handleLoginSuccess = () => {
    const redirectPath = location.state?.from || "/home";
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="landing-wrapper">

      {/* 🔥 Aurora Background ONLY for Landing */}
      <div className="landing-aurora">
        <Aurora
          colorStops={["#7a4a7d", "#310fdb", "#0aa3f0"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </div>

      {/* Foreground Content */}
      <div className="landing-content">
        <h1>FitFlicks</h1>

        <button
          className="get-started-btn"
          onClick={() => setShowAuthModal(true)}
        >
          Get Started
        </button>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
