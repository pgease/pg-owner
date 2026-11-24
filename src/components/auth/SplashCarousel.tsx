import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { hideSplashScreen } from "@/lib/appShell";

const CAROUSEL_SEEN_KEY = "pgease_onboarding_carousel_seen";
const PGEASE_TOKEN_KEY = "pgease_token";
const ACCESS_TOKEN_KEY = "access_token";

interface SlideData {
  imageWebp: string;
  imagePng: string;
  title: string;
  subtitle: string;
}

const OWNER_SLIDES: SlideData[] = [
  {
    imageWebp: "/onboarding/onboarding-1.webp",
    imagePng: "/onboarding/onboarding-1.png",
    title: "Manage your PG in one app",
    subtitle: "Rooms, beds, tenants and rent, all in one place.",
  },
  {
    imageWebp: "/onboarding/onboarding-2.webp",
    imagePng: "/onboarding/onboarding-2.png",
    title: "Collect rent without chasing",
    subtitle: "Auto reminders on WhatsApp and online or UPI payments.",
  },
  {
    imageWebp: "/onboarding/onboarding-3.webp",
    imagePng: "/onboarding/onboarding-3.png",
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
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] flex items-center justify-center select-none overflow-hidden font-poppins">
      <div
        className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#FFFFFF] flex flex-col justify-between overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Top Header with Skip (hidden on slide 3) */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-end px-6 pt-4 pb-2"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          {!isLast && (
            <button
              type="button"
              onClick={() => finishToAuth("/login")}
              className="w-[58px] h-[30px] rounded-[15px] bg-[#EEF5F5] hover:bg-[#E0ECEC] active:scale-95 text-[14px] font-medium text-[#008080] flex items-center justify-center transition-all"
            >
              Skip
            </button>
          )}
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between pt-12 pb-32">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {OWNER_SLIDES.map((slide) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex flex-col items-center justify-between px-6 pt-2 pb-2 select-none"
              >
                {/* Illustration (1080x900 aspect ratio, scale down on short screens) */}
                <div className="w-full flex-1 max-h-[48vh] sm:max-h-[50vh] flex items-center justify-center min-h-[160px]">
                  <picture>
                    <source srcSet={slide.imageWebp} type="image/webp" />
                    <img
                      src={slide.imagePng}
                      alt={slide.title}
                      className="w-full h-full max-h-[320px] aspect-[1080/900] object-contain pointer-events-none"
                      draggable={false}
                    />
                  </picture>
                </div>

                {/* Title & Subtitle */}
                <div className="w-full text-center mt-3 mb-2 px-2 flex flex-col items-center">
                  <h2
                    className="text-[24px] font-semibold text-[#1F2937] leading-[34px] tracking-tight max-w-[320px]"
                    style={{ textWrap: "balance" as any }}
                  >
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-[15px] font-normal text-[#6B7280] leading-[24px] max-w-[290px]">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-5 bg-white pt-2 pb-6 px-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* Active 24x8 Teal Pill, Inactive 8x8 #CFD8DC Circle, gap 8, animated */}
          <div className="flex items-center gap-2">
            {OWNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className="focus:outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-[24px] bg-[#008080]" : "w-[8px] bg-[#CFD8DC]"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Primary Action Button (52dp height, radius 14, #008080, Poppins SemiBold 16) */}
          <div className="w-full">
            <button
              type="button"
              onClick={nextSlide}
              className="w-full h-[52px] rounded-[14px] bg-[#008080] hover:bg-[#006e6e] active:scale-[0.98] text-white font-semibold text-[16px] shadow-sm flex items-center justify-center transition-all"
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
