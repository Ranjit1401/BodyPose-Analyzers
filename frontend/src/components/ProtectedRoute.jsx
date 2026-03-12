import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth state to be restored from localStorage
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#9ca3af"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        state={{ from: location.pathname, openLogin: true }}
        replace
      />
    );
  }

  return children;
}
