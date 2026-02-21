import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");

  const handleReset = async () => {
    if (!newPassword) {
      alert("Enter new password");
      return;
    }

    try {
      await resetPassword({
        token: token,
        new_password: newPassword,
      });

      alert("Password updated successfully");
      navigate("/"); // go back to login
    } catch (error) {
      alert(error.response?.data?.detail || "Reset failed");
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Set New Password</h2>

      <input
        type="password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ padding: "10px", marginTop: "20px" }}
      />

      <br />

      <button
        onClick={handleReset}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Reset Password
      </button>
    </div>
  );
}
