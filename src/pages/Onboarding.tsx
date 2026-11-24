import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { motion, cubicBezier } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Building2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
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

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function findMatchingState(rawState: string): string {
  if (!rawState) return "";
  const cleaned = rawState.toLowerCase().replace(/[^a-z]/g, "");
  const found = INDIAN_STATES.find(
    (s) =>
      s.toLowerCase().replace(/[^a-z]/g, "") === cleaned ||
      s.toLowerCase().includes(rawState.toLowerCase()) ||
      rawState.toLowerCase().includes(s.toLowerCase())
  );
  return found || "";
}

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
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: EASE },
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
    ownerName: "Your Full Name (Owner Name)",
    ownerNamePlaceholder: "e.g. Rahul Sharma",
    pgName: "PG / Property Name",
    pgNamePlaceholder: "e.g. Royal Comfort PG, Sri Sai Residency",
    pgType: "PG Type",
    selectBedRange: "Total Bed Capacity",
    addressLabel: "PG Address",
    addressLine1Label: "Address Line 1",
    addressLine1Placeholder: "Flat / House / Building No.",
    streetLabel: "Street / Area / Landmark",
    streetPlaceholder: "Street name, Sector, Landmark",
    cityLabel: "City",
    cityPlaceholder: "e.g. Noida / Bengaluru",
    stateLabel: "State",
    statePlaceholder: "Select State",
    pincodeLabel: "Pin Code",
    pincodePlaceholder: "6-digit PIN",
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
    locationDenied: "Location permission denied. Please enter address and 6-digit pincode manually.",
    locationFailed: "Could not get location. Try again or enter address with pincode.",
    geocodeFailed: "Could not find that address. Please check city and 6-digit pincode.",
    needPinOrLocation: "Please enter a valid 6-digit pincode.",
    loadTypesError: "Could not load property types. Using default.",
    propertiesTitle: "Your Properties / PGs",
    propertiesSub: "Select a PG to open its dashboard, or set up a new property.",
    addNewPg: "Add Another PG / Property",
  },
  hi: {
    portalBadge: "ओनर ऑनबोर्डिंग",
    stepBadge: "चरण 1 का 1 • त्वरित सेटअप",
    step2Title: "अपने PG के बारे में बताएं",
    step2Sub: "रूम, बेड और ऑटोमैटिक व्हाट्सएप किराया वसूली शुरू करने के लिए नीचे अपनी प्रॉपर्टी का विवरण दें।",
    ownerName: "आपका पूरा नाम (मालिक का नाम)",
    ownerNamePlaceholder: "उदा. राहुल शर्मा",
    pgName: "PG / प्रॉपर्टी का नाम",
    pgNamePlaceholder: "उदा. रॉयल कम्फर्ट पीजी, श्री साई रेजीडेंसी",
    pgType: "PG का प्रकार",
    selectBedRange: "कुल बेड क्षमता",
    addressLabel: "PG का पता",
    addressLine1Label: "पता लाइन 1",
    addressLine1Placeholder: "मकान / फ्लैट / बिल्डिंग नंबर",
    streetLabel: "गली / मोहल्ला / लैंडमार्क",
    streetPlaceholder: "सड़क, सेक्टर या लैंडमार्क",
    cityLabel: "शहर",
    cityPlaceholder: "उदा. नोएडा / बेंगलुरु",
    stateLabel: "राज्य",
    statePlaceholder: "राज्य चुनें",
    pincodeLabel: "पिन कोड",
    pincodePlaceholder: "6-अंकीय पिनकोड",
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
    locationDenied: "लोकेशन अनुमति नहीं मिली। कृपया पता और 6 अंकों का पिनकोड स्वयं दर्ज करें।",
    locationFailed: "लोकेशन नहीं मिल सकी। फिर कोशिश करें या पिनकोड सहित पता दर्ज करें।",
    geocodeFailed: "पता नहीं मिला। कृपया शहर और 6 अंकों का पिनकोड जांचें।",
    needPinOrLocation: "कृपया मान्य 6-अंकीय पिनकोड दर्ज करें।",
    loadTypesError: "प्रकार लोड नहीं हो सके। डिफ़ॉल्ट उपयोग हो रहा है।",
    propertiesTitle: "आपकी प्रॉपर्टीज / PGs",
    propertiesSub: "डैशबोर्ड खोलने के लिए अपनी प्रॉपर्टी चुनें या नई जोड़ें।",
    addNewPg: "नई प्रॉपर्टी / PG जोड़ें",
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
  const houseNo = rawAddress?.house_number || rawAddress?.building || rawAddress?.house || "";
  const road = rawAddress?.road || rawAddress?.pedestrian || rawAddress?.street || "";
  const suburb = rawAddress?.suburb || rawAddress?.neighbourhood || rawAddress?.residential || rawAddress?.subdistrict || "";

  const cityPart = rawAddress?.city || rawAddress?.town || rawAddress?.village || rawAddress?.city_district || rawAddress?.county || "";
  const statePart = rawAddress?.state || rawAddress?.state_district || "";
  let postcode = rawAddress?.postcode?.match(/\d{6}/)?.[0] || extractIndianPincode(displayName) || "";
  postcode = refinePostcode(displayName, postcode) || postcode;

  // Address Line 1 should ONLY be house/flat/building name/number, NEVER full address or city/state/pin
  const line1 = houseNo;
  // Street / Area / Landmark
  const street = [road, suburb].filter(Boolean).join(", ");

  return { addressLine1: line1, street, city: cityPart, state: statePart, postcode };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ displayName: string; postcode: string | null; addressLine1: string; street: string; city: string; state: string } | null> {
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
    street: parsed.street,
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
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${active ? "bg-[#008080] text-white" : "bg-blue-50 text-blue-600"}`}>
        <User className="h-4 w-4" />
      </div>
    );
  }
  if (lower.includes("girl") || lower.includes("female")) {
    return (
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${active ? "bg-[#008080] text-white" : "bg-pink-50 text-pink-600"}`}>
        <User className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${active ? "bg-[#008080] text-white" : "bg-teal-50 text-[#008080]"}`}>
      <Building className="h-4 w-4" />
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
  const [ownerName, setOwnerName] = useState("");
  const [pgName, setPgName] = useState("");

  // Structured address fields
  const [addressLine1, setAddressLine1] = useState("");
  const [street, setStreet] = useState("");
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
        if (rev.addressLine1) setAddressLine1(rev.addressLine1);
        if (rev.street) setStreet(rev.street);
        if (rev.city) setCity(rev.city);
        if (rev.state) {
          const matched = findMatchingState(rev.state);
          if (matched) setStateName(matched);
        }
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

  const handlePropertyContinue = async () => {
    // Explicit user validation feedback
    if (!ownerName.trim()) {
      toast({ title: "Please enter your name", description: "Owner name is required.", variant: "destructive" });
      return;
    }
    if (!pgName.trim()) {
      toast({ title: "Please enter PG / Property name", description: "e.g. Royal Comfort PG", variant: "destructive" });
      return;
    }
    if (!bedRange) {
      toast({ title: "Please select total bed capacity", description: "Choose the bed range for your property.", variant: "destructive" });
      return;
    }
    if (!addressLine1.trim()) {
      toast({ title: "Please enter Address Line 1", description: "Building, house or flat number is required.", variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: "Please enter city", variant: "destructive" });
      return;
    }
    if (!stateName.trim()) {
      toast({ title: "Please select your state", variant: "destructive" });
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      toast({ title: "Please enter a valid 6-digit pin code", variant: "destructive" });
      return;
    }

    if (properties && properties.length > 0 && subAccess.isExpired) {
      setGateModalOpen(true);
      return;
    }

    const fullAddress = [
      addressLine1.trim(),
      street.trim(),
      city.trim(),
      stateName.trim(),
      pincode.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    let lat = latitude;
    let lng = longitude;
    let pin = pincode.trim() || locationPin.trim() || extractIndianPincode(fullAddress) || "";

    try {
      setIsSubmitting(true);

      if (lat == null || lng == null) {
        let geo = await forwardGeocodeIndia(fullAddress);
        if (!geo && city.trim() && pin) {
          geo = await forwardGeocodeIndia(`${city.trim()} ${pin}, India`);
        }
        if (!geo && pin) {
          geo = await forwardGeocodeIndia(`${pin}, India`);
        }
        if (geo) {
          lat = geo.lat;
          lng = geo.lon;
          if (!pin && geo.postcode) pin = geo.postcode;
          setLatitude(lat);
          setLongitude(lng);
        } else {
          // Default fallback coordinates if geocoding times out so owner is never blocked
          lat = 20.5937;
          lng = 78.9629;
        }
      }

      const newPg = await createProperty({
        name: pgName.trim(),
        address: fullAddress,
        latitude: lat ?? 20.5937,
        longitude: lng ?? 78.9629,
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

  const isFormValid =
    Boolean(ownerName.trim()) &&
    Boolean(pgName.trim()) &&
    Boolean(propertyTypeId) &&
    Boolean(bedRange) &&
    Boolean(addressLine1.trim()) &&
    Boolean(city.trim()) &&
    Boolean(stateName.trim()) &&
    /^\d{6}$/.test(pincode.trim());

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
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-[#E6F3F3] via-[#F4F9F9] to-[#F8FAFB] pointer-events-none" />

      {/* Subtle micro dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #008080 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 w-full shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3.5 sm:px-8 py-2.5 flex items-center justify-between z-30 shadow-2xs">
        {/* Brand Logo & Portal Badge */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <div className="flex items-center gap-2">
            <img
              src={pgeaseLogo}
              alt="PG Ease"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl shadow-2xs object-cover"
            />
            <span className="font-extrabold text-[15px] sm:text-[18px] tracking-tight text-[#1F2937]">
              PG Ease
            </span>
          </div>

          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-[#008080]/30 text-[#008080] bg-[#E8F4F4] text-[10px] font-bold tracking-wider uppercase">
            {T.portalBadge}
          </span>
        </div>

        {/* Right Controls: WhatsApp Support & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Support Phone */}
          <a
            href="https://wa.me/917701953356"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs font-semibold text-gray-700 transition-colors"
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
                className={`px-2.5 sm:px-3 py-0.5 rounded-full text-xs font-semibold transition-all ${
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

      {/* ================= MAIN ONBOARDING CONTENT (Mobile Responsive) ================= */}
      <main className="flex-1 w-full max-w-2xl lg:max-w-3xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 flex flex-col justify-start md:justify-center z-10">
        {!showForm && properties.length > 0 ? (
          /* ================= RETURNING OWNER PROPERTY PICKER ================= */
          <motion.div {...stepMotion} className="space-y-4 md:my-auto w-full">
            <div className="text-center space-y-1">
              <div className="inline-flex h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200/80 items-center justify-center text-[#008080] shadow-2xs mb-0.5">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {T.propertiesTitle}
              </h1>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {T.propertiesSub}
              </p>
            </div>

            <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-lg shadow-gray-200/40 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="grid gap-2.5 max-h-[320px] overflow-y-auto pr-1">
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
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200/90 bg-white hover:border-[#008080] hover:bg-teal-50/20 hover:shadow-xs transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-[#E8F4F4] border border-[#008080]/20 flex items-center justify-center text-xs font-bold text-[#008080] group-hover:scale-105 transition-transform shrink-0">
                            {initials || "PG"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-[#008080] transition-colors truncate">
                              {pg.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5 max-w-[260px] sm:max-w-md">
                              {pg.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-flex text-[10px] font-bold text-[#008080] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#008080] hover:bg-teal-50/30 text-gray-700 hover:text-[#008080] font-bold text-xs transition-all mt-2 active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4 text-[#008080]" />
                  <span>{T.addNewPg}</span>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ================= MAIN PG OWNER ONBOARDING FORM ================= */
          <motion.div {...stepMotion} className="space-y-3.5 md:my-auto py-1 w-full">
            {/* Top Page Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F4F4] border border-[#008080]/30 text-[#008080] text-[10px] font-bold tracking-wider uppercase">
                <Sparkles className="h-3 w-3" />
                <span>{T.stepBadge}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                {T.step2Title}
              </h1>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {T.step2Sub}
              </p>
            </div>

            {/* Main Form Card Container */}
            <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40">
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                {/* 1. Owner Full Name & PG Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-name" className="text-xs sm:text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-[#008080]" />
                      <span>{T.ownerName}</span>
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="owner-name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder={T.ownerNamePlaceholder}
                      className="h-12 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-sm font-medium text-gray-900 px-4 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pg-name" className="text-xs sm:text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[#008080]" />
                      <span>{T.pgName}</span>
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="pg-name"
                      value={pgName}
                      onChange={(e) => setPgName(e.target.value)}
                      placeholder={T.pgNamePlaceholder}
                      className="h-12 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-sm font-medium text-gray-900 px-4 transition-all"
                    />
                  </div>
                </div>

                {/* 2. Property Type Selection (Dropdown on mobile, tiles on desktop) */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-[#008080]" />
                    <span>{T.pgType}</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>

                  {/* Mobile View: Clean Select Dropdown */}
                  <div className="block sm:hidden">
                    <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] text-sm text-gray-800 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15">
                        <SelectValue placeholder={T.selectTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePropertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id} className="text-sm py-2">
                            <span className="font-medium">{type.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop / Tablet View: Grid Tiles */}
                  <div className="hidden sm:grid sm:grid-cols-3 gap-2">
                    {availablePropertyTypes.slice(0, 3).map((type) => {
                      const isSelected = propertyTypeId === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setPropertyTypeId(type.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-[#008080] bg-teal-50/70 shadow-2xs ring-1 ring-[#008080]"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                          }`}
                        >
                          {getPropertyTypeIcon(type.name, isSelected)}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs sm:text-[13px] font-bold leading-tight truncate ${isSelected ? "text-[#008080]" : "text-gray-800"}`}>
                              {type.name}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="h-4 w-4 rounded-full bg-[#008080] text-white flex items-center justify-center shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Overflow Property Types for Desktop if more than 3 */}
                  {availablePropertyTypes.length > 3 && (
                    <div className="hidden sm:block">
                      <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
                        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-[#F9FAFB] text-xs sm:text-sm text-gray-800 mt-1">
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
                    </div>
                  )}
                </div>

                {/* 3. Bed Capacity / Range Selection (Dropdown on mobile, pill buttons on desktop) */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4 text-[#008080]" />
                    <span>{T.selectBedRange}</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>

                  {/* Mobile View: Clean Select Dropdown */}
                  <div className="block sm:hidden">
                    <Select value={bedRange} onValueChange={setBedRange}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] text-sm text-gray-800 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15">
                        <SelectValue placeholder={T.selectRangePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {bedOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-sm py-2">
                            <span className="font-medium">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop / Tablet View: Pill Buttons */}
                  <div className="hidden sm:grid sm:grid-cols-5 gap-1.5">
                    {bedOptions.map((opt) => {
                      const isSelected = bedRange === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBedRange(opt.value)}
                          className={`h-10 rounded-xl border text-xs sm:text-[13px] font-bold transition-all flex items-center justify-center ${
                            isSelected
                              ? "bg-[#008080] border-[#008080] text-white shadow-2xs"
                              : "bg-[#F9FAFB] border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/20"
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Structured Address Fields (Address Line 1, Street, City, State, Pin Code) */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#008080]" />
                      <span>{T.addressLabel}</span>
                      <span className="text-red-500 font-bold">*</span>
                    </Label>

                    {/* "Use current location" Action Pill */}
                    <button
                      type="button"
                      onClick={() => void handleUseLocation()}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F4F4] hover:bg-[#d8eded] border border-[#008080]/30 text-xs font-bold text-[#008080] shadow-2xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
                      title="Auto-detect address via GPS"
                    >
                      {locating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-[#008080]" />
                          <span>{T.locating}</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3.5 w-3.5 text-[#008080]" />
                          <span>{T.useLocation}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Row 1: Address Line 1 & Street / Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="address-line-1" className="text-xs font-semibold text-gray-700">
                        {T.addressLine1Label} <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        id="address-line-1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder={T.addressLine1Placeholder}
                        className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-xs sm:text-sm text-gray-900 px-3.5 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="street" className="text-xs font-semibold text-gray-700">
                        {T.streetLabel}
                      </Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder={T.streetPlaceholder}
                        className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-xs sm:text-sm text-gray-900 px-3.5 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: City, State (Dropdown with red *), Pin Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs font-semibold text-gray-700">
                        {T.cityLabel} <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={T.cityPlaceholder}
                        className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-xs sm:text-sm text-gray-900 px-3.5 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-xs font-semibold text-gray-700">
                        {T.stateLabel} <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Select value={stateName} onValueChange={setStateName}>
                        <SelectTrigger id="state" className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] text-xs sm:text-sm text-gray-800 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15">
                          <SelectValue placeholder={T.statePlaceholder} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs sm:text-sm">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pincode" className="text-xs font-semibold text-gray-700">
                        {T.pincodeLabel} <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        value={pincode}
                        maxLength={6}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder={T.pincodePlaceholder}
                        className="h-11 rounded-xl border-gray-200 bg-[#F9FAFB] focus:bg-white focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/15 text-xs sm:text-sm font-mono text-gray-900 px-3.5 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Button (Enabled ONLY when mandatory fields are filled) */}
                <div className="pt-2 sm:pt-3 space-y-1.5">
                  <Button
                    type="button"
                    onClick={() => void handlePropertyContinue()}
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full h-13 sm:h-14 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
                      isFormValid && !isSubmitting
                        ? "bg-[#008080] hover:bg-[#006e6e] text-white shadow-lg shadow-teal-700/25 active:scale-[0.99] cursor-pointer"
                        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <span>{T.saving}</span>
                      </>
                    ) : (
                      <>
                        <span>{T.continue}</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trust and Security Guarantee */}
            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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
