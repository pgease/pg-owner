import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAppShell } from "./lib/appShell";
import "./index.css";

initAppShell();

createRoot(document.getElementById("root")!).render(<App />);
