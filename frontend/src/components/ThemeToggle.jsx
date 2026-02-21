import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      style={{
        marginLeft: "20px",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: "pointer"
      }}
    >
      {darkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
