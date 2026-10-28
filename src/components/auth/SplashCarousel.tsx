import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";

const CAROUSEL_SEEN_KEY = "pgease_onboarding_carousel_seen";

const SLIDES = [
  {
    title: "PG Ease owner app",
    body: "Add tenants, track rent, and manage operations effortlessly.",
  },
  {
    title: "PG Management, Simplified",
    body: "From tenant onboarding to rent tracking–everything in one place.",
  },
  {
    title: "Run Your PG Without the Hassle",
    body: "Manage tenants, payments, and updates from a single dashboard.",
  },
] as const;

function markSeen() {
  try {
    window.localStorage.setItem(CAROUSEL_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function hasSeenOnboardingCarousel(): boolean {
  try {
    return window.localStorage.getItem(CAROUSEL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function SplashCarousel({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"splash" | "carousel" | "auth">(() =>
    hasSeenOnboardingCarousel() ? "auth" : "splash",
  );
  const [index, setIndex] = useState(0);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "splash") return;
    const t = window.setTimeout(() => setPhase("carousel"), 1500);
    return () => window.clearTimeout(t);
  }, [phase]);

  const goAuth = (path: "/login" | "/signup") => {
    markSeen();
    setPhase("auth");
    navigate(path);
  };

  if (phase === "auth") return <>{children}</>;

  if (phase === "splash") {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-[#008080]">
        <img src={pgeaseIconWhite} alt="PG Ease" className="h-24 w-24 object-contain" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-white flex flex-col" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="flex-1 flex flex-col items-center pt-10 overflow-hidden">
        <div
          className="w-full overflow-hidden touch-pan-y"
          onPointerDown={(e) => {
            dragX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (dragX.current == null) return;
            const dx = e.clientX - dragX.current;
            dragX.current = null;
            if (dx < -50 && index < SLIDES.length - 1) setIndex(index + 1);
            else if (dx > 50 && index > 0) setIndex(index - 1);
          }}
          onPointerCancel={() => {
            dragX.current = null;
          }}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((item) => (
              <div key={item.title} className="w-full shrink-0 px-6 flex flex-col items-center text-center">
                <div className="w-full max-w-[358px] flex flex-col items-center">
                  <h1 className="text-[24px] font-medium text-[#18212B]">{item.title}</h1>
                  <p className="mt-2 text-[14px] text-[#636363]">{item.body}</p>
                  <div className="mt-6 w-full aspect-[3/4] max-h-[280px] rounded-[28px] bg-[#008080]" aria-hidden />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5" aria-label="Slide indicators">
          {SLIDES.map((item, i) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setIndex(i)}
              className="flex h-11 w-11 items-center justify-center"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span className={`h-2 rounded-full ${i === index ? "w-4 bg-[#008080]" : "w-2 bg-[#D5DBE1]"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => goAuth("/signup")}
          className="h-[60px] w-full max-w-[358px] rounded-[46px] bg-[#008080] text-white text-[16px] font-medium"
        >
          Signup via mobile number
        </button>
        <button
          type="button"
          onClick={() => goAuth("/login")}
          className="h-[60px] w-full max-w-[358px] rounded-[46px] bg-[#E5E5E5] text-[#18212B] text-[16px] font-medium"
        >
          Login
        </button>
        <p className="text-[14px] text-[#18212B]">
          By continuing{" "}
          <Link to="/terms-and-conditions" className="underline">
            Terms&conditions
          </Link>
        </p>
      </div>
    </div>
  );
}
