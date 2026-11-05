import { Link } from "react-router-dom";
import {
  Check,
  Globe,
  Loader2,
  Smartphone,
  Shield,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Lock,
} from "lucide-react";
import type { OtpChannel } from "@/api/propertyOwner";

type Lang = "en" | "hi";

const COPY = {
  en: {
    welcomeTitle: "Welcome Back 👋",
    welcomeSubtitle: "Enter your mobile number to sign in or register",
    mobileNumber: "Mobile Number",
    phonePlaceholder: "10-digit number",
    receiveVia: "Receive OTP via:",
    getOtpWhatsapp: "Get Verification Code on WhatsApp",
    getOtpSms: "Get Verification Code on SMS",
    sending: "Sending code...",
    didntReceiveWa: "Didn't receive code on WhatsApp?",
    getOtpViaSms: "Get OTP via SMS",
    preferWa: "Prefer WhatsApp instead?",
    getOtpViaWa: "Get OTP on WhatsApp",
    verifyTitle: "Verify 4-Digit Code",
    verifySubtitleWa: "Enter the 4-digit verification code sent via WhatsApp to",
    verifySubtitleSms: "Enter the 4-digit verification code sent via SMS to",
    editNumber: "Edit Number",
    resendIn: "Resend in",
    resendCode: "Resend Code",
    verifyContinue: "Verify & Continue",
    verifying: "Verifying...",
    safeBadge: "100% Safe & Instant Verification",
    termsPrefix: "By continuing, you agree to our",
    termsLink: "Terms & Conditions",
    and: "and",
    privacyLink: "Privacy Policy",
    successTitle: "Authenticated Successfully",
    successBody: "Connecting to your property portfolio...",
  },
  hi: {
    welcomeTitle: "वापसी पर स्वागत है 👋",
    welcomeSubtitle: "साइन इन या रजिस्टर करने के लिए मोबाइल नंबर दर्ज करें",
    mobileNumber: "मोबाइल नंबर",
    phonePlaceholder: "10-अंकीय नंबर दर्ज करें",
    receiveVia: "ओटीपी माध्यम चुनें:",
    getOtpWhatsapp: "व्हाट्सएप पर वेरिफिकेशन कोड पाएं",
    getOtpSms: "एसएमएस द्वारा वेरिफिकेशन कोड पाएं",
    sending: "भेज रहे हैं...",
    didntReceiveWa: "व्हाट्सएप पर कोड नहीं मिला?",
    getOtpViaSms: "एसएमएस द्वारा ओटीपी पाएं",
    preferWa: "व्हाट्सएप पर मंगाना चाहते हैं?",
    getOtpViaWa: "व्हाट्सएप पर ओटीपी पाएं",
    verifyTitle: "4-अंकीय कोड सत्यापित करें",
    verifySubtitleWa: "व्हाट्सएप पर भेजा गया 4-अंकीय कोड दर्ज करें",
    verifySubtitleSms: "एसएमएस द्वारा भेजा गया 4-अंकीय कोड दर्ज करें",
    editNumber: "नंबर बदलें",
    resendIn: "पुनः भेजें",
    resendCode: "कोड पुनः भेजें",
    verifyContinue: "सत्यापित करें और आगे बढ़ें",
    verifying: "सत्यापन जारी है...",
    safeBadge: "100% सुरक्षित और त्वरित सत्यापन",
    termsPrefix: "आगे बढ़कर आप सहमत हैं",
    termsLink: "नियम और शर्तें",
    and: "और",
    privacyLink: "गोपनीयता नीति",
    successTitle: "लॉगिन सफल",
    successBody: "आपके प्रॉपर्टी पोर्टफोलियो से जुड़ रहे हैं...",
  },
};

function WhatsAppIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="#25D366"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
      />
      <path
        fill="#FFFFFF"
        d="M17.53 14.39C17.23 14.24 15.77 13.52 15.5 13.42C15.23 13.32 15.03 13.27 14.83 13.57C14.63 13.87 14.06 14.54 13.89 14.74C13.72 14.94 13.54 14.96 13.25 14.81C12.95 14.66 12 14.35 10.86 13.34C9.98 12.55 9.38 11.58 9.21 11.28C9.03 10.98 9.19 10.82 9.34 10.67C9.47 10.54 9.64 10.33 9.79 10.15C9.93 9.98 9.98 9.85 10.08 9.66C10.18 9.46 10.13 9.28 10.06 9.14C9.98 8.99 9.38 7.53 9.14 6.93C8.89 6.35 8.65 6.43 8.47 6.42C8.3 6.41 8.1 6.41 7.9 6.41C7.7 6.41 7.38 6.48 7.11 6.78C6.83 7.08 6.06 7.8 6.06 9.26C6.06 10.72 7.13 12.13 7.27 12.33C7.42 12.53 9.37 15.53 12.35 16.82C13.06 17.13 13.61 17.31 14.04 17.45C14.75 17.67 15.4 17.64 15.91 17.57C16.48 17.48 17.67 16.85 17.92 16.15C18.16 15.46 18.16 14.86 18.09 14.74C18.02 14.61 17.82 14.54 17.53 14.39Z"
      />
    </svg>
  );
}

export function MobileAuthSheet({
  isSignup: _isSignup,
  lang,
  onLangToggle,
  step,
  showSuccess,
  ownerName: _ownerName,
  onOwnerNameChange: _onOwnerNameChange,
  nameError: _nameError,
  phone,
  onPhoneChange,
  phoneError,
  channel,
  onChannel,
  onSendOtp,
  isSendingOtp,
  canSubmitPhone,
  otp,
  onOtpChange,
  otpError,
  onVerify,
  isVerifyingOtp,
  onChangeNumber,
  onResend,
  onResendChannel,
  secondsLeft,
  canResend,
  shaking,
}: {
  isSignup: boolean;
  lang: Lang;
  onLangToggle: () => void;
  step: "phone" | "otp" | "first_time_name";
  showSuccess: boolean;
  ownerName: string;
  onOwnerNameChange: (v: string) => void;
  nameError: string;
  phone: string;
  onPhoneChange: (v: string) => void;
  phoneError: string;
  channel: OtpChannel;
  onChannel: (c: OtpChannel) => void;
  onSendOtp: () => void;
  isSendingOtp: boolean;
  canSubmitPhone: boolean;
  otp: string;
  onOtpChange: (v: string) => void;
  otpError: string;
  onVerify: () => void;
  isVerifyingOtp: boolean;
  onChangeNumber: () => void;
  onResend: () => void;
  onResendChannel?: (channel: OtpChannel) => void;
  secondsLeft: number;
  canResend: boolean;
  shaking: boolean;
}) {
  const t = COPY[lang];
  const onOtpStep = step === "otp";

  return (
    <div className="md:hidden relative min-h-[100dvh] bg-[#F8FAFC] flex flex-col justify-between overflow-x-hidden">
      {/* Top Deep Teal Curved Header */}
      <div className="relative bg-gradient-to-b from-[#004D4D] via-[#006060] to-[#008080] pt-7 pb-20 px-6 text-white overflow-hidden">
        {/* Soft Decorative Ambient Circles */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute top-24 -left-14 h-40 w-40 rounded-full bg-white/5 blur-lg pointer-events-none" />

        {/* Top Header Row with Back Button and Language Pill */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (onOtpStep) onChangeNumber();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all tap-target"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onLangToggle}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-white/25 transition-all font-semibold"
          >
            <Globe className="h-3.5 w-3.5 text-white/90" />
            <span>{lang === "en" ? "हिंदी" : "English"}</span>
          </button>
        </div>

        {/* Brand App Icon & Title & Owner App Badge */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#008080] border-2 border-white/20 shadow-lg p-2.5 mb-2.5">
            <img
              src="/favicon.png"
              alt="PG Ease"
              className="h-full w-full object-contain filter drop-shadow"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">PG Ease</h1>
          <span className="mt-1 inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
            Owner App
          </span>
        </div>
      </div>

      {/* Floating White Card */}
      <div className="relative z-20 -mt-10 px-5 flex-1 flex flex-col justify-between">
        <div className={`rounded-3xl bg-white p-6 shadow-xl border border-gray-100/80 space-y-4 animate-fade-in ${shaking ? "animate-shake" : ""}`}>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B4E5C5] bg-[#ECFAF1] text-[#157F3D]">
                <Check className="h-7 w-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-[#18212B]">{t.successTitle}</h3>
              <p className="text-xs text-gray-500">{t.successBody}</p>
            </div>
          ) : onOtpStep ? (
            /* ================= OTP VERIFICATION ================= */
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">
                  {t.verifyTitle}
                </h2>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {channel === "whatsapp" ? t.verifySubtitleWa : t.verifySubtitleSms}{" "}
                  <strong className="text-gray-800 tabular-nums">+91 {phone}</strong>
                </p>
              </div>

              {/* 4 Digit Boxes */}
              <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-1">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(-1);
                      const newOtpArr = (otp || "").split("");
                      newOtpArr[index] = val;
                      const newOtp = newOtpArr.join("");
                      onOtpChange(newOtp);
                      if (val && index < 3) {
                        const nextEl = document.getElementById(`owner-sheet-otp-${index + 1}`);
                        nextEl?.focus();
                      }
                      if (val && index === 3 && newOtp.length === 4) {
                        onVerify();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index] && index > 0) {
                        const prevEl = document.getElementById(`owner-sheet-otp-${index - 1}`);
                        prevEl?.focus();
                      }
                    }}
                    id={`owner-sheet-otp-${index}`}
                    className="h-14 w-12 sm:w-14 rounded-2xl border-2 border-gray-200 bg-gray-50/50 text-center text-xl font-black text-gray-900 focus:border-[#008080] focus:bg-white focus:outline-none transition-all shadow-sm"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-xs font-medium text-red-600">{otpError}</p>
              )}

              {/* Resend Controls */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={onChangeNumber}
                  className="font-medium text-gray-500 hover:text-gray-800"
                >
                  {t.editNumber}
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={isSendingOtp}
                    className="flex items-center gap-1 font-bold text-[#008080] hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t.resendCode}</span>
                  </button>
                ) : (
                  <span className="text-gray-400">
                    {t.resendIn} <strong className="text-gray-700">{secondsLeft}s</strong>
                  </span>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={onVerify}
                disabled={otp.length !== 4 || isVerifyingOtp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-sm font-bold text-white shadow-md shadow-[#008080]/25 hover:bg-[#006b6b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none tap-target"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>{t.verifying}</span>
                  </>
                ) : (
                  <>
                    <span>{t.verifyContinue}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* On-Demand Fallback (Switch to SMS or WhatsApp) */}
              <div className="pt-2.5 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() =>
                    onResendChannel
                      ? onResendChannel(channel === "whatsapp" ? "sms" : "whatsapp")
                      : onResend()
                  }
                  disabled={isSendingOtp}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                >
                  <span>{channel === "whatsapp" ? t.didntReceiveWa : t.preferWa}</span>
                  <span className="font-bold text-[#008080] underline flex items-center gap-1">
                    {channel === "whatsapp" ? (
                      <>
                        <Smartphone className="h-3.5 w-3.5" />
                        {t.getOtpViaSms}
                      </>
                    ) : (
                      <>
                        <WhatsAppIcon size={14} />
                        {t.getOtpViaWa}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= PHONE INPUT FORM ================= */
            <div className="space-y-4">
              {/* Card Title & Subtitle */}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
                  {t.welcomeTitle}
                </h2>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {t.welcomeSubtitle}
                </p>
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-1.5 pt-0.5">
                <label className="text-xs font-bold text-gray-700">
                  {t.mobileNumber}
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-[#008080] focus-within:ring-2 focus-within:ring-[#008080]/10 transition-all">
                  {/* Flag + Country Code Pill */}
                  <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-200/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 mr-2.5 flex-shrink-0 select-none">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmitPhone && !isSendingOtp) {
                        e.preventDefault();
                        onSendOtp();
                      }
                    }}
                    placeholder={t.phonePlaceholder}
                    autoFocus
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none tracking-wide"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-600 font-medium pt-0.5">{phoneError}</p>
                )}
              </div>

              {/* Channel Selector with Official WhatsApp Logo */}
              <div className="flex items-center justify-between text-xs pt-1 px-0.5">
                <span className="text-gray-400 font-medium">{t.receiveVia}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChannel("whatsapp")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      channel === "whatsapp"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-400 font-bold shadow-xs"
                        : "text-gray-500 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <WhatsAppIcon size={14} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChannel("sms")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      channel === "sms"
                        ? "bg-teal-50 text-teal-800 border border-teal-400 font-bold shadow-xs"
                        : "text-gray-500 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-[#008080]" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={!canSubmitPhone || isSendingOtp}
                onClick={onSendOtp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-sm font-bold text-white shadow-md shadow-[#008080]/25 hover:bg-[#006b6b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none tap-target"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>{t.sending}</span>
                  </>
                ) : (
                  <>
                    {channel === "whatsapp" ? (
                      <WhatsAppIcon size={16} />
                    ) : (
                      <Smartphone className="h-4 w-4 text-white" />
                    )}
                    <span>
                      {channel === "whatsapp" ? t.getOtpWhatsapp : t.getOtpSms}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* 100% Safe Verification Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-gray-50 border border-gray-200/60 py-2 px-3 text-xs text-gray-500 font-medium">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                <span>{t.safeBadge}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Terms & Conditions */}
        <div className="py-6 text-center space-y-3">
          <p className="text-[11px] text-gray-400 leading-relaxed px-4">
            {t.termsPrefix}{" "}
            <Link
              to="/terms"
              className="text-[#008080] underline font-medium hover:text-[#006060]"
            >
              {t.termsLink}
            </Link>{" "}
            {t.and}{" "}
            <Link
              to="/privacy"
              className="text-[#008080] underline font-medium hover:text-[#006060]"
            >
              {t.privacyLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
