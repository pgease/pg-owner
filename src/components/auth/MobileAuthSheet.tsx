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
    welcomeTitle: "Welcome to PG Ease Manager",
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
    welcomeTitle: "Welcome to PG Ease Manager",
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
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z" fill="#25D366" />
      <path d="M17.53 14.39C17.23 14.24 15.77 13.52 15.5 13.42C15.23 13.32 15.03 13.27 14.83 13.57C14.63 13.87 14.06 14.54 13.89 14.74C13.72 14.94 13.54 14.96 13.25 14.81C12.95 14.66 12 14.35 10.86 13.34C9.98 12.55 9.38 11.58 9.21 11.28C9.03 10.98 9.19 10.82 9.34 10.67C9.47 10.54 9.64 10.33 9.79 10.15C9.93 9.98 9.98 9.85 10.08 9.66C10.18 9.46 10.13 9.28 10.06 9.14C9.98 8.99 9.38 7.53 9.14 6.93C8.89 6.35 8.65 6.43 8.47 6.42C8.3 6.41 8.1 6.41 7.9 6.41C7.7 6.41 7.38 6.48 7.11 6.78C6.83 7.08 6.06 7.8 6.06 9.26C6.06 10.72 7.13 12.13 7.27 12.33C7.42 12.53 9.37 15.53 12.35 16.82C13.06 17.13 13.61 17.31 14.04 17.45C14.75 17.67 15.4 17.64 15.91 17.57C16.48 17.48 17.67 16.85 17.92 16.15C18.16 15.46 18.16 14.86 18.09 14.74C18.02 14.61 17.82 14.54 17.53 14.39Z" fill="#FFFFFF" />
    </svg>
  );
}

export function MobileAuthSheet({
  lang,
  onLangToggle,
  step,
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
  lang: Lang;
  onLangToggle: () => void;
  step: "phone" | "otp";
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
    <div className="md:hidden relative min-h-[100dvh] bg-[#FFFFFF] flex flex-col justify-between overflow-x-hidden overflow-y-auto font-poppins select-none" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      {/* Top 320dp Soft Gradient from #E6F3F3 to #FFFFFF */}
      <div className="absolute top-0 inset-x-0 h-[320px] bg-gradient-to-b from-[#E6F3F3] to-[#FFFFFF] pointer-events-none" />

      {/* Top Navigation Row: Back / Language Toggle */}
      <div
        className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        {onOtpStep ? (
          <button
            type="button"
            onClick={onChangeNumber}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-xs border border-gray-200/60 hover:bg-white active:scale-95 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}

        <button
          type="button"
          onClick={onLangToggle}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs text-gray-700 shadow-xs border border-gray-200/60 hover:bg-white transition-all font-semibold"
        >
          <Globe className="h-3.5 w-3.5 text-[#008080]" />
          <span>{lang === "en" ? "हिंदी" : "English"}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-1 pb-4 max-w-md mx-auto w-full">
        {/* Logo: 96dp Teal (#008080) Circle with White Mark Inside (60dp tall, centered, NO white box) */}
        <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[#008080] shadow-md mb-3 sm:mb-5 shrink-0">
          <img
            src="/brand/pgease-mark-white.svg"
            alt="PG Ease Manager"
            className="h-[60px] w-auto object-contain"
          />
        </div>

        {/* Title and Subtitle: Truly Centered */}
        <div className="w-full text-center mb-3 sm:mb-5 shrink-0">
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#1F2937] leading-[30px] sm:leading-[34px] tracking-tight w-full text-center">
            {onOtpStep ? t.verifyTitle : t.welcomeTitle}
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14px] font-normal text-[#6B7280] leading-[20px] sm:leading-[22px] max-w-[300px] mx-auto text-center">
            {onOtpStep ? (
              <>
                {channel === "whatsapp" ? t.verifySubtitleWa : t.verifySubtitleSms}{" "}
                <strong className="text-gray-900 tabular-nums">+91 {phone}</strong>
              </>
            ) : (
              t.welcomeSubtitle
            )}
          </p>
        </div>

        {/* Form Container */}
        <div className={`w-full space-y-3.5 sm:space-y-4 ${shaking ? "animate-shake" : ""}`}>
          {onOtpStep ? (
            /* ================= OTP VERIFICATION ================= */
            <div className="space-y-4">
              {/* 4 Digit Boxes */}
              <div className="flex justify-center items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(-1);
                      const newOtpArr = (otp || "").split("");
                      newOtpArr[idx] = val;
                      const newOtp = newOtpArr.join("");
                      onOtpChange(newOtp);
                      if (val && idx < 3) {
                        const nextEl = document.getElementById(`owner-sheet-otp-${idx + 1}`);
                        nextEl?.focus();
                      }
                      if (val && idx === 3 && newOtp.length === 4) {
                        onVerify();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                        const prevEl = document.getElementById(`owner-sheet-otp-${idx - 1}`);
                        prevEl?.focus();
                      }
                    }}
                    id={`owner-sheet-otp-${idx}`}
                    className="h-[52px] w-[52px] rounded-[12px] border border-[#D1D5DB] bg-[#F9FAFB] text-center text-xl font-bold text-gray-900 focus:border-[#008080] focus:bg-white focus:outline-none transition-all shadow-xs"
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
                    className="flex items-center gap-1 font-semibold text-[#008080] hover:underline"
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

              {/* Verify Button: 52dp height, radius 12, #008080 */}
              <button
                type="button"
                onClick={onVerify}
                disabled={otp.length !== 4 || isVerifyingOtp}
                className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[12px] bg-[#008080] text-sm font-semibold text-white shadow-sm hover:bg-[#006e6e] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
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

              {/* Fallback Channel */}
              <div className="pt-2 text-center">
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
                  <span className="font-semibold text-[#008080] underline flex items-center gap-1">
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
              {/* Input: height 52, radius 12, border #D1D5DB, fill #F9FAFB, divider after +91 */}
              <div className="space-y-1.5">
                <div className="flex items-center h-[52px] rounded-[12px] border border-[#D1D5DB] bg-[#F9FAFB] px-3 shadow-xs focus-within:border-[#008080] focus-within:bg-white transition-all">
                  {/* +91 Prefix with clean divider */}
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 pr-2.5 border-r border-[#D1D5DB] flex-shrink-0 select-none">
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
                    className="w-full bg-transparent pl-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none tracking-wide"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-600 font-medium pt-0.5">{phoneError}</p>
                )}
              </div>

              {/* Channel Selector */}
              <div className="flex items-center justify-between text-xs pt-0.5 px-0.5">
                <span className="text-gray-400 font-medium">{t.receiveVia}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChannel("whatsapp")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                      channel === "whatsapp"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-400 font-semibold"
                        : "text-gray-500 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <WhatsAppIcon size={14} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChannel("sms")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                      channel === "sms"
                        ? "bg-teal-50 text-teal-800 border border-teal-400 font-semibold"
                        : "text-gray-500 hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-[#008080]" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              {/* CTA Button: 52dp height, radius 12, #008080, disabled until 10 digits */}
              <button
                type="button"
                onClick={onSendOtp}
                disabled={!canSubmitPhone || isSendingOtp}
                className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[12px] bg-[#008080] text-sm font-semibold text-white shadow-sm hover:bg-[#006e6e] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>{t.sending}</span>
                  </>
                ) : (
                  <>
                    <span>{channel === "whatsapp" ? t.getOtpWhatsapp : t.getOtpSms}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Safe Badge & Footer Terms */}
        <div className="w-full text-center mt-auto pt-3 sm:pt-6 pb-2 space-y-1.5 shrink-0">
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>{t.safeBadge}</span>
          </div>

          <p className="text-[11px] text-gray-400 leading-tight">
            {t.termsPrefix}{" "}
            <Link to="/terms" className="text-gray-600 underline font-medium">
              {t.termsLink}
            </Link>{" "}
            {t.and}{" "}
            <Link to="/privacy" className="text-gray-600 underline font-medium">
              {t.privacyLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
