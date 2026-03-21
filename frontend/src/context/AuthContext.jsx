import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize from localStorage so auth survives page refresh
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("userEmail");
      return token && email ? { email } : null;
    } catch {
      return null;
    }
  });

  const login = (email) => {
    localStorage.setItem("userEmail", email);
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
