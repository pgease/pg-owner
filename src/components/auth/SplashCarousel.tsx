import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";

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

function PhoneMock() {
  return (
    <div className="relative mx-auto mt-6 w-[220px] max-w-[70%]" aria-hidden>
      <div className="rounded-[36px] bg-[#d4d4d4] p-[7px] shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <div className="relative overflow-hidden rounded-[30px] bg-[#008080] aspect-[9/16]">
          <div className="absolute left-1/2 top-2.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-[#111]" />
          <div className="absolute right-3 top-6 h-3 w-3 rounded-full bg-[#1a1a1a]/40" />
        </div>
      </div>
    </div>
  );
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
    <div className="min-h-dvh w-full bg-white flex flex-col overflow-hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ paddingTop: "var(--safe-top)" }}>
        <div
          className="flex-1 min-h-0 w-full overflow-hidden"
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
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((item) => (
              <div
                key={item.title}
                className="flex h-full min-w-0 shrink-0 basis-full flex-col items-center overflow-hidden px-4 pt-8 text-center"
              >
                <img
                  src={pgeaseIconColor}
                  alt=""
                  className="h-12 w-12 rounded-[10px] object-cover"
                />
                <h1 className="mt-3 text-[24px] font-medium leading-[30px] text-[#18212B]">{item.title}</h1>
                <p className="mt-1 max-w-[358px] text-[14px] leading-[18px] text-[#636363]">{item.body}</p>
                <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden">
                  <PhoneMock />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2 py-3" aria-label="Slide indicators">
          {SLIDES.map((item, i) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setIndex(i)}
              className="flex h-11 w-11 items-center justify-center"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            >
              <span className={`h-2 rounded-full ${i === index ? "w-4 bg-[#008080]" : "w-2 bg-[#D5DBE1]"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 flex flex-col items-center gap-3 shrink-0">
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
