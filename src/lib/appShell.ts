const STORAGE_KEY = "pgease_app_shell";

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readQueryFlag(): boolean | null {
  if (!hasWindow()) return null;
  const value = new URLSearchParams(window.location.search).get("app");
  if (value === "1") return true;
  if (value === "0") return false;
  return null;
}

function readUserAgentFlag(): boolean {
  if (!hasWindow()) return false;
  return /PGEaseApp/i.test(window.navigator.userAgent || "");
}

export function isAppShell(): boolean {
  if (!hasWindow()) return false;
  return document.documentElement.classList.contains("pgease-native");
}

export function initAppShell(): boolean {
  if (!hasWindow()) return false;

  const query = readQueryFlag();
  const fromUa = readUserAgentFlag();

  if (query === false) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.remove("pgease-native");
    delete document.documentElement.dataset.appShell;
    return false;
  }

  let stored = false;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    stored = false;
  }

  const enabled = query === true || fromUa || stored;

  if (query === true || fromUa) {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (enabled) {
    document.documentElement.classList.add("pgease-native");
    document.documentElement.dataset.appShell = "1";
  } else {
    document.documentElement.classList.remove("pgease-native");
    delete document.documentElement.dataset.appShell;
  }

  return enabled;
}
