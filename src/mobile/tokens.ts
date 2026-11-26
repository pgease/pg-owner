export type IconTone =
  | "teal"
  | "blue"
  | "green"
  | "emerald"
  | "amber"
  | "orange"
  | "rose"
  | "red"
  | "indigo"
  | "violet"
  | "sky";

export const tokens = {
  brand: { 50: "#E6F3F3", 100: "#CCE6E6", 600: "#008080", 700: "#006B6B", 800: "#005F5F" },
  ink: { 900: "#1F2937", 700: "#374151", 500: "#6B7280", 400: "#9CA3AF" },
  surface: { page: "#F5F7F8", card: "#FFFFFF", border: "#E5E9EB", divider: "#EEF1F2" },
  semantic: {
    pending: { bg: "#FEF3C7", fg: "#92400E", icon: "#F59E0B", border: "#FCD34D" },
    danger: { bg: "#FEE2E2", fg: "#B91C1C", icon: "#DC2626", border: "#FCA5A5" },
    success: { bg: "#DCFCE7", fg: "#15803D", icon: "#16A34A", border: "#86EFAC" },
    info: { bg: "#DBEAFE", fg: "#1D4ED8", icon: "#2563EB", border: "#93C5FD" },
  },
  premium: { from: "#111827", to: "#0B3B3B", gold: "#F5C451" },
  tones: {
    teal: { bg: "#E6F3F3", fg: "#008080", darkBg: "rgba(20,163,163,0.18)", darkFg: "#2DD4D4" },
    blue: { bg: "#DBEAFE", fg: "#2563EB", darkBg: "rgba(59,130,246,0.18)", darkFg: "#60A5FA" },
    green: { bg: "#DCFCE7", fg: "#16A34A", darkBg: "rgba(34,197,94,0.18)", darkFg: "#4ADE80" },
    emerald: { bg: "#D1FAE5", fg: "#059669", darkBg: "rgba(16,185,129,0.18)", darkFg: "#34D399" },
    amber: { bg: "#FEF3C7", fg: "#D97706", darkBg: "rgba(245,158,11,0.18)", darkFg: "#FBBF24" },
    orange: { bg: "#FFEDD5", fg: "#EA580C", darkBg: "rgba(249,115,22,0.18)", darkFg: "#FB923C" },
    rose: { bg: "#FFE4E6", fg: "#E11D48", darkBg: "rgba(244,63,94,0.18)", darkFg: "#FB7185" },
    red: { bg: "#FEE2E2", fg: "#DC2626", darkBg: "rgba(239,68,68,0.18)", darkFg: "#F87171" },
    indigo: { bg: "#E0E7FF", fg: "#4F46E5", darkBg: "rgba(99,102,241,0.18)", darkFg: "#818CF8" },
    violet: { bg: "#EDE9FE", fg: "#7C3AED", darkBg: "rgba(139,92,246,0.18)", darkFg: "#A78BFA" },
    sky: { bg: "#E0F2FE", fg: "#0284C7", darkBg: "rgba(14,165,233,0.18)", darkFg: "#38BDF8" },
  },
  dark: {
    page: "#0F1720",
    card: "#1F2937",
    raised: "#273241",
    text: "#F3F4F6",
    muted: "#9CA3AF",
    border: "#374151",
    headerStart: "#006B6B",
    headerEnd: "#004747",
    mascotCircle: "#12302F",
  },
  space: [0, 4, 8, 12, 16, 20, 24, 32],
  radius: { card: 20, tile: 16, button: 14, chip: 999, sheet: 24 },
  control: { primary: 48, secondary: 40, small: 36, minHit: 44 },
  motion: { push: 250, pop: 220, tab: 150, sheet: 240 },
  lowCreditsThreshold: 5,
} as const;
