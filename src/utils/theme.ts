export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "pgease_theme";

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const isDark = mode === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
  root.style.backgroundColor = isDark ? "#0F1720" : "#F3F4F6";
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem("theme", mode);
    const prefs = (window as any).Capacitor?.Plugins?.Preferences;
    if (prefs?.set) {
      void prefs.set({ key: STORAGE_KEY, value: mode });
    }
  } catch {
    // ignore storage errors
  }
}

export async function hydrateTheme(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const prefs = (window as any).Capacitor?.Plugins?.Preferences;
    if (prefs?.get) {
      const res = await prefs.get({ key: STORAGE_KEY });
      if (res?.value === "dark" || res?.value === "light") {
        applyTheme(res.value);
        return;
      }
    }
    const local = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("theme");
    if (local === "dark" || local === "light") {
      applyTheme(local);
    }
  } catch {
    // ignore hydration errors
  }
}
