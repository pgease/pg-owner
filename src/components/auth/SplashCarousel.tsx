import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { hideSplashScreen } from "@/lib/appShell";

const CAROUSEL_SEEN_KEY = "pgease_onboarding_carousel_seen";
const PGEASE_TOKEN_KEY = "pgease_token";
const ACCESS_TOKEN_KEY = "access_token";

interface SlideData {
  svg: string;
  fallback: string;
  title: string;
  subtitle: string;
}

const OWNER_SLIDES: SlideData[] = [
  {
    svg: "/slides/slide-1.svg",
    fallback: "/slides/slide-1.jpg",
    title: "Manage your PG in one app",
    subtitle: "Rooms, beds, tenants and rent, all in one place.",
  },
  {
    svg: "/slides/slide-2.svg",
    fallback: "/slides/slide-2.jpg",
    title: "Collect rent without chasing",
    subtitle: "Auto reminders on WhatsApp and online or UPI payments.",
  },
  {
    svg: "/slides/slide-3.svg",
    fallback: "/slides/slide-3.jpg",
    title: "Know your PG at a glance",
    subtitle: "Vacant beds, dues, complaints and reports, live.",
  },
];

function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      window.localStorage.getItem(PGEASE_TOKEN_KEY) ||
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
      window.localStorage.getItem("pgease_auth_token")
    );
  } catch {
    return false;
  }
}

function hasSeenOnboardingCarousel(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const isTour = new URLSearchParams(window.location.search).get("tour") === "1";
    if (isTour) return false;
    if (isUserLoggedIn()) return true;
    return window.localStorage.getItem(CAROUSEL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(CAROUSEL_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function SplashCarousel({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isTour = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour") === "1";

  const [hasCompleted, setHasCompleted] = useState<boolean>(() => {
    if (isTour) return false;
    return hasSeenOnboardingCarousel();
  });

  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);

  // Hide native Capacitor splash screen smoothly once React mounts
  useEffect(() => {
    hideSplashScreen();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (hasCompleted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIndex((prev) => Math.min(prev + 1, OWNER_SLIDES.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        finishToAuth("/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasCompleted]);

  const finishToAuth = (path: string = "/login") => {
    markSeen();
    setHasCompleted(true);
    navigate(path);
  };

  const nextSlide = () => {
    if (index < OWNER_SLIDES.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      finishToAuth("/login");
    }
  };

  const prevSlide = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  // Touch & Swipe gestures
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
    if (diff > 45 && index < OWNER_SLIDES.length - 1) {
      nextSlide();
    } else if (diff < -45 && index > 0) {
      prevSlide();
    }
    startX.current = null;
    currentX.current = null;
  };

  if (hasCompleted) {
    return <>{children}</>;
  }

  const isLast = index === OWNER_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] flex items-center justify-center select-none overflow-hidden font-poppins">
      <div
        className="relative w-full h-[100dvh] max-w-md mx-auto bg-white flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:h-[92dvh] sm:shadow-2xl sm:border sm:border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Top Header with Skip */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 pt-4 pb-2"
          style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#008080] flex items-center justify-center text-white text-[11px] font-bold">
              PG
            </div>
            <span className="text-xs font-bold tracking-wider text-[#1F2937] uppercase">PG Ease</span>
          </div>

          <button
            type="button"
            onClick={() => finishToAuth("/login")}
            className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-semibold text-[#4B5563] transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between pt-16 pb-28">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {OWNER_SLIDES.map((slide, i) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex flex-col items-center justify-between px-6 pt-4 pb-2 select-none"
              >
                {/* Top 50-55%: Illustration */}
                <div className="w-full flex-1 max-h-[52vh] flex items-center justify-center">
                  <img
                    src={slide.svg}
                    alt={slide.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = slide.fallback;
                    }}
                    className="w-full h-full max-h-[300px] object-contain pointer-events-none drop-shadow-sm"
                    draggable={false}
                  />
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="w-full text-center mt-3 mb-2 px-2 flex flex-col items-center">
                  <h2 className="text-2xl font-semibold text-[#1F2937] tracking-tight leading-snug">
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-sm font-normal text-[#4B5563] leading-relaxed max-w-xs">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-5 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-6 px-6"
          style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
        >
          {/* Pagination Dots (Elongated Teal pill for active, small gray circles for inactive) */}
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
                    i === index ? "w-7 bg-[#008080]" : "w-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Primary Action Button (Teal #008080, min 48dp target) */}
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              onClick={nextSlide}
              className="w-full h-[52px] rounded-2xl bg-[#008080] hover:bg-[#006e6e] active:scale-[0.98] text-white font-semibold text-base shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>{isLast ? "Get Started" : "Next"}</span>
              {isLast ? (
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
