import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import pgeaseLogo from "@/assets/pgease-logo.png";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

const CAROUSEL_SEEN_KEY = "pgease_onboarding_carousel_seen";

interface SlideData {
  src: string;
  title: string;
  subtitle: string;
  alt: string;
}

const OWNER_SLIDES: SlideData[] = [
  {

        src: "/slides/slide-3.jpg",
    title: "Run your PG smoothly",
    subtitle: "Manage complaints and daily updates.",
    alt: "Run your PG smoothly slide",
  },
  {
    src: "/slides/slide-1.jpg",
    title: "Manage tenants easily",
    subtitle: "Rooms, beds and tenant details in one place.",
    alt: "Manage tenants easily slide",
  },
  {

        src: "/slides/slide-2.jpg",
    title: "Stay on top of rent",
    subtitle: "Track payments, dues and reminders.",
    alt: "Stay on top of rent slide",
  },
];

function markSeen() {
  try {
    window.localStorage.setItem(CAROUSEL_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function hasSeenOnboardingCarousel(): boolean {
  try {
    const isTour = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour") === "1";
    if (isTour) return false;
    return window.localStorage.getItem(CAROUSEL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function SplashCarousel({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isTour = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour") === "1";

  const [phase, setPhase] = useState<"splash" | "carousel" | "auth">(() => {
    if (isTour) return "carousel";
    return hasSeenOnboardingCarousel() ? "auth" : "splash";
  });

  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);

  // Splash timer (1.2s cold boot splash)
  useEffect(() => {
    if (phase !== "splash") return;
    const timer = window.setTimeout(() => {
      setPhase("carousel");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== "carousel") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIndex((prev) => Math.min(prev + 1, OWNER_SLIDES.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        goAuth("/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  const goAuth = (path: "/login" | "/signup") => {
    markSeen();
    setPhase("auth");
    navigate(path);
  };

  const nextSlide = () => {
    if (index < OWNER_SLIDES.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      goAuth("/login");
    }
  };

  const prevSlide = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    currentX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startX.current === null) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    currentX.current = clientX;
  };

  const handleTouchEnd = () => {
    if (startX.current === null || currentX.current === null) return;
    const diff = startX.current - currentX.current;
    if (diff > 40 && index < OWNER_SLIDES.length - 1) {
      nextSlide();
    } else if (diff < -40 && index > 0) {
      prevSlide();
    }
    startX.current = null;
    currentX.current = null;
  };

  if (phase === "auth") {
    return <>{children}</>;
  }

  // 1. Initial Launch Splash Screen
  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#004d40] text-white">
        <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          <div className="h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-md p-4 flex items-center justify-center shadow-2xl border border-white/20">
            <img src={pgeaseLogo} alt="PG Ease" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">PG Ease</h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-white/70 uppercase">Owner Portal</p>
          <div className="mt-6 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Starting up...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full-Screen Interactive 3-Slide Walkthrough
  return (
    <div className="fixed inset-0 z-50 bg-[#00382e] flex items-center justify-center overflow-hidden">
      <div
        className="relative w-full h-[100dvh] max-w-[440px] mx-auto bg-[#004d40] flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:h-[92dvh] sm:shadow-2xl sm:border sm:border-white/10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Floating Top Bar */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 pt-4 pb-2"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2 rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 border border-white/15">
            <img src={pgeaseLogo} alt="" className="h-4 w-4 object-contain brightness-200" />
            <span className="text-[11px] font-bold tracking-wider text-white uppercase">PG Ease</span>
          </div>

          <button
            type="button"
            onClick={() => goAuth("/login")}
            className="rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white border border-white/20 shadow-sm transition-all"
          >
            Skip
          </button>
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {OWNER_SLIDES.map((slide, i) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex items-center justify-center overflow-hidden select-none bg-[#004d40]"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Bottom Navigation & Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-6 px-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            {OWNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className="p-1 focus:outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            {index < OWNER_SLIDES.length - 1 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goAuth("/login")}
                  className="flex-1 py-3 text-white/80 hover:text-white text-sm font-semibold text-center transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="flex-[1.5] py-3.5 px-5 rounded-full bg-white text-[#004d40] font-bold text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => goAuth("/signup")}
                  className="w-full py-4 rounded-full bg-white text-[#004d40] font-extrabold text-base shadow-2xl hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => goAuth("/login")}
                  className="w-full py-2 text-white/90 hover:text-white text-xs font-medium text-center transition-colors"
                >
                  Already registered? <span className="underline font-bold text-white">Login directly</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
