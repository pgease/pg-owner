import { useEffect } from "react";

export function useThemeMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("pgease_theme", "light");
  }, []);

  return {
    isDark: false,
    setIsDark: () => {},
    toggleTheme: () => {},
  };
}
