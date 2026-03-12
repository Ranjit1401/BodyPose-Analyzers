// Theme utility module for consistent dark/light mode handling
export const initializeTheme = () => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    applyTheme(savedTheme);
    return savedTheme;
};

export const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("appTheme", theme);
};

export const toggleTheme = () => {
    const currentTheme = localStorage.getItem("appTheme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
    return newTheme;
};

export const getCurrentTheme = () => {
    return localStorage.getItem("appTheme") || "dark";
};
