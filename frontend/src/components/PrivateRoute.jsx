import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default PrivateRoute;
