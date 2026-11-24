import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  CheckCircle2,
  Building2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Globe,
  Loader2,
  Plus,
  ChevronRight,
  Sparkles,
  User,
  BedDouble,
  Navigation,
  Check,
  Building,
  Home,
  CheckCircle,
} from "lucide-react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { toast } from "@/components/ui/use-toast";
import {
  createProperty,
  updateMe,
  getPropertyTypesAndAmenities,
  type PropertyType,
  DEFAULT_PROPERTY_TYPE_ID,
} from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";

type Lang = "en" | "hi";

function WhatsAppIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" stroke="#25D366" strokeWidth="2" />
      <path
        d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"
        fill="#25D366"
      />
    </svg>
  );
}

const EASE = cubicBezier(0.16, 1, 0.3, 1);

const stepMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: EASE },
};

/** Bed range values aligned with Figma / API examples */
const BED_RANGE_OPTIONS = [
  { value: "5-10", labelEn: "5–10 Beds", labelHi: "5–10 बेड" },
  { value: "11-20", labelEn: "11–20 Beds", labelHi: "11–20 बेड" },
  { value: "21-50", labelEn: "21–50 Beds", labelHi: "21–50 बेड" },
  { value: "51-100", labelEn: "51–100 Beds", labelHi: "51–100 बेड" },
  { value: "100+", labelEn: "100+ Beds", labelHi: "100+ बेड" },
] as const;

const TEXTS = {
  en: {
    portalBadge: "OWNER ONBOARDING",
    stepBadge: "STEP 1 OF 1 • INSTANT SETUP",
    step2Title: "Tell us about your PG",
    step2Sub: "Enter your property details below to configure rooms, beds, and automated WhatsApp rent collection.",
    proTrialTitle: "✨ 45-Day Free Pro Trial Included",
    proTrialDesc: "Unlimited tenant onboarding, WhatsApp rent reminders, digital KYC, automated receipts, and room allocation at zero cost during your trial.",
    ownerName: "Your Full Name (Owner Name)",
    ownerNamePlaceholder: "e.g. Rahul Sharma",
    ownerNameHint: "Printed on official rent receipts, tenant verification forms, and owner profile.",
    pgName: "PG / Property Name",
    pgNamePlaceholder: "e.g. Royal Comfort PG, Sri Sai Residency",
    pgType: "PG Type",
    selectBedRange: "Total Bed Capacity",
    addressLabel: "PG Address & Location",
    addressPlaceholder: "Complete building address (street, area, landmark, city, state, 6-digit pincode)",
    useLocation: "Use current location",
    locating: "Detecting GPS…",
    goToDashboard: "Go to Dashboard",
    back: "Back",
    continue: "Create PG & Launch Dashboard",
    saving: "Creating Your PG…",
    successSub: "Welcome to PG Ease. You can start managing your property from the dashboard.",
    secureFooter: "256-bit Bank-Grade Encryption • Your Property & Tenant Data is Strictly Private",
    selectTypePlaceholder: "Select type",
    selectRangePlaceholder: "Choose range",
    locationDenied: "Location permission denied. Add a full address with a 6-digit pincode.",
    locationFailed: "Could not get location. Try again or enter address with pincode.",
    geocodeFailed: "Could not find that address. Check the address or use current location.",
    needPinOrLocation: "Enter a 6-digit pincode in the address or use current location.",
    loadTypesError: "Could not load property types. Using default.",
    propertiesTitle: "Your Properties / PGs",
    propertiesSub: "Select a PG to open its dashboard, or set up a new property.",
    addNewPg: "Add Another PG / Property",
    gpsDetected: "GPS Location Verified",
  },
  hi: {
    portalBadge: "ओनर ऑनबोर्डिंग",
    stepBadge: "चरण 1 का 1 • त्वरित सेटअप",
    step2Title: "अपने PG के बारे में बताएं",
    step2Sub: "रूम, बेड और ऑटोमैटिक व्हाट्सएप किराया वसूली शुरू करने के लिए नीचे अपनी प्रॉपर्टी का विवरण दें।",
    proTrialTitle: "✨ 45 दिनों का मुफ़्त Pro ट्रायल शामिल",
    proTrialDesc: "ट्रायल के दौरान असीमित किरायेदार ऑनबोर्डिंग, व्हाट्सएप किराया रिमाइंडर, डिजिटल केवाईसी और रसीदें पूरी तरह मुफ़्त।",
    ownerName: "आपका पूरा नाम (मालिक का नाम)",
    ownerNamePlaceholder: "उदा. राहुल शर्मा",
    ownerNameHint: "किराया रसीदों, किरायेदार केवाईसी और ओनर प्रोफ़ाइल पर दिखाई देगा।",
    pgName: "PG / प्रॉपर्टी का नाम",
    pgNamePlaceholder: "उदा. रॉयल कम्फर्ट पीजी, श्री साई रेजीडेंसी",
    pgType: "PG का प्रकार",
    selectBedRange: "कुल बेड क्षमता",
    addressLabel: "PG का पता और लोकेशन",
    addressPlaceholder: "पूरा पता (गली, मोहल्ला, लैंडमार्क, शहर, राज्य, 6-अंकीय पिनकोड)",
    useLocation: "करंट लोकेशन उपयोग करें",
    locating: "लोकेशन मिल रही है…",
    goToDashboard: "डैशबोर्ड पर जाएं",
    back: "पीछे",
    continue: "PG बनाएं और डैशबोर्ड खोलें",
    saving: "PG बन रहा है…",
    successSub: "PG Ease में आपका स्वागत है। डैशबोर्ड से प्रॉपर्टी मैनेज करें।",
    secureFooter: "256-बिट बैंक-ग्रेड एन्क्रिप्शन • आपकी प्रॉपर्टी और किरायेदार का डेटा सुरक्षित है",
    selectTypePlaceholder: "प्रकार चुनें",
    selectRangePlaceholder: "रेंज चुनें",
    locationDenied: "लोकेशन अनुमति नहीं मिली। पते में 6 अंकों का पिनकोड जोड़ें।",
    locationFailed: "लोकेशन नहीं मिल सकी। फिर कोशिश करें या पिनकोड सहित पता दर्ज करें।",
    geocodeFailed: "पता नहीं मिला। पता जाँचें या करंट लोकेशन उपयोग करें।",
    needPinOrLocation: "पते में 6 अंकों का पिनकोड दें या करंट लोकेशन उपयोग करें।",
    loadTypesError: "प्रकार लोड नहीं हो सके। डिफ़ॉल्ट उपयोग हो रहा है।",
    propertiesTitle: "आपकी प्रॉपर्टीज / PGs",
    propertiesSub: "डैशबोर्ड खोलने के लिए अपनी प्रॉपर्टी चुनें या नई जोड़ें।",
    addNewPg: "नई प्रॉपर्टी / PG जोड़ें",
    gpsDetected: "जीपीएस लोकेशन सत्यापित",
  },
};

function extractIndianPincode(address: string): string | null {
  const m = address.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

function refinePostcode(address: string, detectedPostcode: string | null): string | null {
  const lower = address.toLowerCase();
  if (lower.includes("shipra sun city") || lower.includes("shipra suncity") || lower.includes("indirapuram")) {
    return "201014";
  }
  if (lower.includes("vaishali")) {
    return "201010";
  }
  if (lower.includes("vasundhara")) {
    return "201012";
  }
  return detectedPostcode;
}

const NOMINATIM_UA = "PGEase-OwnerWeb/1.0 (support@pgease.in)";

function parseAddressComponents(displayName: string, rawAddress?: Record<string, string>) {
  const houseNo = rawAddress?.house_number || rawAddress?.building || "";
  const road = rawAddress?.road || rawAddress?.pedestrian || "";
  const suburb = rawAddress?.suburb || rawAddress?.neighbourhood || rawAddress?.residential || "";

  let line1 = [houseNo, road].filter(Boolean).join(" ");
  let line2 = suburb;

  const cityPart = rawAddress?.city || rawAddress?.town || rawAddress?.village || rawAddress?.city_district || rawAddress?.county || "";
  const statePart = rawAddress?.state || rawAddress?.state_district || "";
  let postcode = rawAddress?.postcode?.match(/\d{6}/)?.[0] || extractIndianPincode(displayName) || "";
  postcode = refinePostcode(displayName, postcode) || postcode;

  if (!line1 && !line2) {
    const parts = displayName.split(",").map((p) => p.trim()).filter(Boolean);
    const cleaned = parts.filter((p) => !/^\d{6}$/.test(p) && p.toLowerCase() !== "india");
    if (cleaned.length >= 3) {
      line1 = cleaned[0] || "";
      line2 = cleaned.slice(1, Math.max(2, cleaned.length - 2)).join(", ");
    } else {
      line1 = displayName;
    }
  }

  return { addressLine1: line1, addressLine2: line2, city: cityPart, state: statePart, postcode };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ displayName: string; postcode: string | null; addressLine1: string; addressLine2: string; city: string; state: string } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };
  const displayName = data.display_name ?? "";
  const rawAddr = data.address || {};
  let postcode = rawAddr.postcode?.match(/\d{6}/)?.[0] ?? null;
  postcode = refinePostcode(displayName, postcode);

  const parsed = parseAddressComponents(displayName, rawAddr);
  return {
    displayName,
    postcode: postcode || parsed.postcode,
    addressLine1: parsed.addressLine1,
    addressLine2: parsed.addressLine2,
    city: parsed.city,
    state: parsed.state,
  };
}

async function forwardGeocodeIndia(query: string): Promise<{ lat: number; lon: number; postcode: string | null } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const arr = (await res.json()) as { lat: string; lon: string; display_name?: string }[];
  if (!arr?.length) return null;
  const item = arr[0];
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const rev = await reverseGeocode(lat, lon);
  return { lat, lon, postcode: rev?.postcode ?? extractIndianPincode(query) };
}

const getPropertyTypeIcon = (name: string, active: boolean) => {
  const lower = name.toLowerCase();
  if (lower.includes("boy")) {
    return (
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#008080] text-white" : "bg-blue-50 text-blue-600"}`}>
        <User className="h-5 w-5" />
      </div>
    );
  }
  if (lower.includes("girl") || lower.includes("female")) {
    return (
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#008080] text-white" : "bg-pink-50 text-pink-600"}`}>
        <User className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#008080] text-white" : "bg-teal-50 text-[#008080]"}`}>
      <Building className="h-5 w-5" />
    </div>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { forceShowForm?: boolean } | null;
  const { properties, setSelectedPgId, refreshProperties, language, setLanguage } = useApp();
  const lang: Lang = language === "hi-IN" ? "hi" : "en";
  const subAccess = useSubscriptionAccess();
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(navState?.forceShowForm ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const currentOwner = authStorage.getPropertyOwner();
  const initialOwnerName = currentOwner?.name && !currentOwner.name.startsWith("user_") ? currentOwner.name : "";
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [pgName, setPgName] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState(DEFAULT_PROPERTY_TYPE_ID);
  const [bedRange, setBedRange] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationPin, setLocationPin] = useState("");

  const T = TEXTS[lang];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPropertyTypesAndAmenities();
        const types = res.propertyTypes ?? [];
        if (cancelled) return;
        setPropertyTypes(types);
        if (types.length) {
          setPropertyTypeId((prev) => (types.some((t) => t.id === prev) ? prev : types[0].id));
        }
      } catch {
        if (!cancelled) {
          toast({ title: TEXTS[lang].loadTypesError, variant: "destructive" });
          setPropertyTypes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const handleUseLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: T.locationFailed, variant: "destructive" });
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);
      const rev = await reverseGeocode(lat, lon);
      if (rev) {
        if (rev.displayName) setAddress(rev.displayName);
        if (rev.addressLine1) setAddressLine1(rev.addressLine1);
        if (rev.addressLine2) setAddressLine2(rev.addressLine2);
        if (rev.city) setCity(rev.city);
        if (rev.state) setStateName(rev.state);
        const pin = rev.postcode || extractIndianPincode(rev.displayName) || "";
        if (pin) {
          setPincode(pin);
          setLocationPin(pin);
        }
      }
      toast({ title: lang === "en" ? "Location detected successfully" : "लोकेशन सफलतापूर्वक मिल गई" });
    } catch {
      toast({ title: T.locationDenied, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  }, [T.locationDenied, T.locationFailed, lang]);

  const canSubmit = useMemo(() => {
    const hasAddress = Boolean(address.trim() || (addressLine1.trim() && city.trim() && pincode.trim()));
    return Boolean(ownerName.trim() && pgName.trim() && hasAddress && propertyTypeId && bedRange);
  }, [ownerName, pgName, address, addressLine1, city, pincode, propertyTypeId, bedRange]);

  const handlePropertyContinue = async () => {
    if (!canSubmit) return;

    if (properties && properties.length > 0 && subAccess.isExpired) {
      setGateModalOpen(true);
      return;
    }

    const fullAddress = address.trim() || [addressLine1.trim(), addressLine2.trim(), city.trim(), stateName.trim(), pincode.trim()].filter(Boolean).join(", ");
    let lat = latitude;
    let lng = longitude;
    let pin = pincode.trim() || locationPin.trim() || extractIndianPincode(fullAddress) || "";

    try {
      setIsSubmitting(true);

      if (lat == null || lng == null) {
        const geo = await forwardGeocodeIndia(fullAddress);
        if (!geo) {
          toast({ title: T.geocodeFailed, variant: "destructive" });
          return;
        }
        lat = geo.lat;
        lng = geo.lon;
        if (!pin && geo.postcode) pin = geo.postcode;
        setLatitude(lat);
        setLongitude(lng);
        if (geo.postcode) setLocationPin(geo.postcode);
      }

      if (!pin || pin.length !== 6) {
        toast({ title: T.needPinOrLocation, variant: "destructive" });
        return;
      }

      const newPg = await createProperty({
        name: pgName.trim(),
        address: fullAddress,
        latitude: lat,
        longitude: lng,
        locationPin: pin,
        bedRange,
        propertyTypeId,
      });

      if (ownerName.trim()) {
        try {
          const updatedOwner = await updateMe({ name: ownerName.trim() });
          authStorage.setPropertyOwner(updatedOwner);
        } catch (nameErr) {
          console.warn("[Onboarding] Could not update owner profile name:", nameErr);
        }
      }

      await refreshProperties();
      setSelectedPgId(newPg.id);
      toast({ title: lang === "en" ? "PG Created Successfully" : "PG सफलतापूर्वक बन गया", description: T.successSub });
      navigate("/dashboard", { replace: true, state: { justOnboarded: true, pgName: pgName.trim() } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Please try again.";
      toast({ title: lang === "en" ? "Could not create PG" : "PG नहीं बन सका", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bedOptions = BED_RANGE_OPTIONS.map((o) => ({
    value: o.value,
    label: lang === "en" ? o.labelEn : o.labelHi,
  }));

  const availablePropertyTypes = propertyTypes.length
    ? propertyTypes
    : [
        { id: DEFAULT_PROPERTY_TYPE_ID, name: "Boys PG", description: null, imageUrl: null },
        { id: "girls-pg", name: "Girls PG", description: null, imageUrl: null },
        { id: "coed-pg", name: "Co-ed / Unisex PG", description: null, imageUrl: null },
      ];

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#1F2937] flex flex-col font-poppins relative selection:bg-[#008080]/15 select-none overflow-x-hidden">
      {/* Soft Brand Teal Gradient Aura at top */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#E6F3F3] via-[#F4F9F9] to-[#F8FAFB] pointer-events-none" />

      {/* Subtle micro dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #008080 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ================= TOP NAVBAR ================= */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Brand Logo & Portal Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-2">
            <img
              src={pgeaseLogo}
              alt="PG Ease"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shadow-xs object-cover"
            />
            <span className="font-extrabold text-[16px] sm:text-[18px] tracking-tight text-[#1F2937]">
              PG Ease
            </span>
          </div>

          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-[#008080]/30 text-[#008080] bg-[#E8F4F4] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            {T.portalBadge}
          </span>
        </div>

        {/* Right Controls: WhatsApp Support & Language Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Support Phone */}
          <a
            href="https://wa.me/917701953356"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs font-semibold text-gray-700 transition-colors"
          >
            <WhatsAppIcon size={14} />
            <span className="text-gray-500 font-medium">Support:</span>
            <span className="tabular-nums text-gray-900 font-bold">+91 77019 53356</span>
          </a>

          {/* Language Toggle Pill */}
          <div className="rounded-full border border-gray-200 bg-white p-0.5 flex shadow-2xs">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l === "en" ? "en-US" : "hi-IN")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l
                    ? "bg-[#008080] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {l === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>

          {/* Dashboard Shortcut if properties exist */}
          {properties && properties.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#008080] hover:text-[#006e6e] px-2.5 py-1 rounded-lg hover:bg-teal-50/60 transition-colors"
            >
              <span>{T.goToDashboard}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ================= MAIN ONBOARDING CONTENT ================= */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex flex-col justify-center">
        {!showForm && properties.length > 0 ? (
          /* ================= RETURNING OWNER PROPERTY PICKER ================= */
          <motion.div {...stepMotion} className="space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 items-center justify-center text-[#008080] shadow-2xs mb-1">
                <Building2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {T.propertiesTitle}
              </h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {T.propertiesSub}
              </p>
            </div>

            <Card className="rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="grid gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {properties.map((pg) => {
                    const initials = pg.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => {
                          setSelectedPgId(pg.id);
                          navigate("/dashboard", { replace: true });
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200/90 bg-white hover:border-[#008080] hover:bg-teal-50/20 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-11 w-11 rounded-2xl bg-[#E8F4F4] border border-[#008080]/20 flex items-center justify-center text-sm font-bold text-[#008080] group-hover:scale-105 transition-transform shrink-0">
                            {initials || "PG"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-[#008080] transition-colors truncate">
                              {pg.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5 max-w-[280px] sm:max-w-md">
                              {pg.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-flex text-[11px] font-bold text-[#008080] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                            Active
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#008080] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Add Another PG Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (subAccess.isExpired) {
                      setGateModalOpen(true);
                    } else {
                      setShowForm(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#008080] hover:bg-teal-50/30 text-gray-700 hover:text-[#008080] font-bold text-sm transition-all mt-4 active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4 text-[#008080]" />
                  <span>{T.addNewPg}</span>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ================= MAIN PG OWNER ONBOARDING FORM ================= */
          <motion.div {...stepMotion} className="space-y-6">
            {/* Top Page Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-[#E8F4F4] border border-[#008080]/20 items-center justify-center text-[#008080] shadow-xs mb-1">
                <Building2 className="h-6 w-6" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F4F4] border border-[#008080]/30 text-[#008080] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
                <Sparkles className="h-3 w-3" />
                <span>{T.stepBadge}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                {T.step2Title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                {T.step2Sub}
              </p>
            </div>

            {/* 45-Day Pro Trial Active Announcement Card */}
            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-amber-50/60 to-teal-50/40 p-4 sm:p-4.5 text-xs shadow-xs flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Sparkles className="h-4.5 w-4.5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-950 text-sm">
                    {T.proTrialTitle}
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-200/70 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                    PRO TRIAL
                  </span>
                </div>
                <p className="text-[11.5px] sm:text-xs text-amber-900/80 mt-1 leading-relaxed">
                  {T.proTrialDesc}
                </p>
              </div>
            </div>

            {/* Main Form Card Container */}
            <Card className="rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* 1. Owner Full Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="owner-name" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#008080]" />
                      <span>{T.ownerName}</span>
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <Input
                    id="owner-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={T.ownerNamePlaceholder}
                    className="h-12 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 text-sm font-medium text-gray-900 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {T.ownerNameHint}
                  </p>
                </div>

                {/* 2. PG Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="pg-name" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#008080]" />
                    <span>{T.pgName}</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pg-name"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                    placeholder={T.pgNamePlaceholder}
                    className="h-12 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 text-sm font-medium text-gray-900 transition-all"
                  />
                </div>

                {/* 3. Property Type Selection Tiles */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-[#008080]" />
                    <span>{T.pgType}</span>
                    <span className="text-red-500">*</span>
                  </Label>

                  {/* Interactive Visual Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {availablePropertyTypes.slice(0, 3).map((type) => {
                      const isSelected = propertyTypeId === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setPropertyTypeId(type.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all relative ${
                            isSelected
                              ? "border-[#008080] bg-teal-50/50 shadow-xs ring-2 ring-[#008080]/15"
                              : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                          }`}
                        >
                          {getPropertyTypeIcon(type.name, isSelected)}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold leading-tight ${isSelected ? "text-[#008080]" : "text-gray-800"}`}>
                              {type.name}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-[#008080] text-white flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Fallback Select dropdown if there are more than 3 property types */}
                  {availablePropertyTypes.length > 3 && (
                    <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] text-sm text-gray-800 mt-2">
                        <SelectValue placeholder={T.selectTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePropertyTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 4. Bed Capacity / Range Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5 text-[#008080]" />
                    <span>{T.selectBedRange}</span>
                    <span className="text-red-500">*</span>
                  </Label>

                  {/* Visual Pill Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {bedOptions.map((opt) => {
                      const isSelected = bedRange === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBedRange(opt.value)}
                          className={`h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-[#008080] border-[#008080] text-white shadow-xs"
                              : "bg-[#F9FAFB] border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/20"
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Address & GPS Location */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="pg-address" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#008080]" />
                      <span>{T.addressLabel}</span>
                      <span className="text-red-500">*</span>
                    </Label>

                    {/* "Use my current location" Action Pill */}
                    <button
                      type="button"
                      onClick={() => void handleUseLocation()}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F4F4] hover:bg-[#d8eded] border border-[#008080]/30 text-xs font-bold text-[#008080] shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                      title="Auto-detect address via GPS"
                    >
                      {locating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#008080]" />
                          <span>{T.locating}</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3 w-3 text-[#008080]" />
                          <span>{T.useLocation}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Textarea
                    id="pg-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={T.addressPlaceholder}
                    rows={3}
                    className="rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 text-sm font-medium text-gray-900 transition-all resize-none"
                  />

                  {/* GPS & Pincode Status Tag */}
                  {(latitude != null || pincode) && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold">{T.gpsDetected}: </span>
                        {latitude != null && longitude != null && (
                          <span className="tabular-nums font-mono text-[11px] text-emerald-700 mr-2">
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                          </span>
                        )}
                        {pincode && (
                          <span className="font-bold text-emerald-900">
                            PIN: {pincode}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  {properties.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="h-12 px-5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      <span>{T.back}</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={() => void handlePropertyContinue()}
                    disabled={!canSubmit || isSubmitting}
                    className="flex-1 h-12 rounded-xl bg-[#008080] hover:bg-[#006e6e] text-white text-sm font-bold shadow-md shadow-teal-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>{T.saving}</span>
                      </>
                    ) : (
                      <>
                        <span>{T.continue}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trust and Security Guarantee */}
            <div className="flex items-center justify-center gap-2 text-center text-xs text-gray-400 pt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{T.secureFooter}</span>
            </div>
          </motion.div>
        )}

        <TrialExpiredGateModal
          open={gateModalOpen}
          onOpenChange={setGateModalOpen}
          featureName="Add New Property / Building"
        />
      </main>
    </div>
  );
};

export default Onboarding;
