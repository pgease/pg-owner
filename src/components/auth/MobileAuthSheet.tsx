import { Link } from "react-router-dom";
import { Check, ChevronDown, Globe, Loader2, MessageSquare } from "lucide-react";
import type { OtpChannel } from "@/api/propertyOwner";

type Lang = "en" | "hi";

const PEEK = {
  title: "Run Your PG Without the Hassle",
  body: "Manage tenants, payments, and updates from a single dashboard.",
};

const COPY = {
  en: {
    signupTitle: "Hi there, lets Login",
    signupBody: "Log in with your phone number to manage your PG effortlessly.",
    loginTitle: "Welcome back",
    loginBody: "Log in with your phone number to manage your PG effortlessly.",
    name: "Name",
    nameOptional: "Name ( optional )",
    namePlaceholder: "Enter your name",
    phoneLabel: "Enter phone number",
    phonePlaceholder: "Enter your number",
    getOtp: "Get OTP",
    sending: "Sending...",
    whatsapp: "WhatsApp",
    sms: "SMS",
    otpTitleSms: "We just sent you an SMS",
    otpTitleWa: "We just sent you a WhatsApp",
    otpSent: "OTP sent to",
    changeNumber: "change number",
    enterOtp: "Enter OTP",
    didntReceive: "Didn't receive it yet ?",
    resend: "Resend",
    continue: "Continue",
    verifying: "Verifying...",
    terms: "By continuing you agree to",
    termsLink: "Terms",
    privacyLink: "Privacy",
    successTitle: "Authenticated Successfully",
    successBody: "Connecting to your property portfolio...",
  },
  hi: {
    signupTitle: "नमस्ते, लॉगिन करें",
    signupBody: "अपना फ़ोन नंबर दर्ज करें और पीजी आसानी से मैनेज करें।",
    loginTitle: "वापसी पर स्वागत है",
    loginBody: "अपना फ़ोन नंबर दर्ज करें और पीजी आसानी से मैनेज करें।",
    name: "नाम",
    nameOptional: "नाम ( वैकल्पिक )",
    namePlaceholder: "अपना नाम दर्ज करें",
    phoneLabel: "फ़ोन नंबर दर्ज करें",
    phonePlaceholder: "अपना नंबर दर्ज करें",
    getOtp: "ओटीपी पाएं",
    sending: "भेज रहे हैं...",
    whatsapp: "व्हाट्सएप",
    sms: "एसएमएस",
    otpTitleSms: "हमने आपको एसएमएस भेजा है",
    otpTitleWa: "हमने आपको व्हाट्सएप भेजा है",
    otpSent: "ओटीपी भेजा गया",
    changeNumber: "नंबर बदलें",
    enterOtp: "ओटीपी दर्ज करें",
    didntReceive: "कोड नहीं मिला ?",
    resend: "पुनः भेजें",
    continue: "जारी रखें",
    verifying: "सत्यापन...",
    terms: "जारी रखकर आप सहमत हैं",
    termsLink: "नियम",
    privacyLink: "गोपनीयता",
    successTitle: "लॉगिन सफल",
    successBody: "आपके प्रॉपर्टी पोर्टफोलियो से जुड़ रहे हैं...",
  },
};

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="shrink-0"
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

function fieldBorder(error: boolean) {
  return error
    ? "border-[1.5px] border-[#DC2626]"
    : "border-[1.5px] border-transparent focus-within:border-[#008080]";
}

function maskPhone(phone: string) {
  if (phone.length < 4) return `+91 ${phone}`;
  return `+91 *****${phone.slice(-4)}`;
}

export function MobileAuthSheet({
  isSignup,
  lang,
  onLangToggle,
  step,
  showSuccess,
  ownerName,
  onOwnerNameChange,
  nameError,
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
  secondsLeft: number;
  canResend: boolean;
  shaking: boolean;
}) {
  const t = COPY[lang];
  const greetingTitle = isSignup ? t.signupTitle : t.loginTitle;
  const greetingBody = isSignup ? t.signupBody : t.loginBody;
  const onOtpStep = step === "otp";

  return (
    <div className="md:hidden relative min-h-dvh w-full overflow-hidden bg-[#4F4F4F] text-black">
      <div
        className="px-4 text-center"
        style={{ paddingTop: "calc(66px + var(--safe-top))" }}
      >
        <h1 className="text-[24px] font-medium leading-[30px] tracking-tight text-white">{PEEK.title}</h1>
        <p className="mt-1 text-[14px] leading-[18px] text-white/80">{PEEK.body}</p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col bg-white"
        style={{
          top: "125px",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: "var(--safe-bottom)",
        }}
      >
        <button
          type="button"
          onClick={onLangToggle}
          aria-label={lang === "en" ? "Switch to Hindi" : "Switch to English"}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-[#636363]"
        >
          <Globe className="h-5 w-5" />
        </button>

        {showSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-13 w-13 items-center justify-center rounded-full border border-[#B4E5C5] bg-[#ECFAF1] text-[#157F3D]">
              <Check className="h-7 w-7 stroke-[2.5]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#18212B]">{t.successTitle}</h3>
            <p className="text-[12px] text-[#636363]">{t.successBody}</p>
          </div>
        ) : (
          <div className={`flex min-h-0 flex-1 flex-col px-6 pt-[54px] ${shaking ? "animate-shake" : ""}`}>
            {onOtpStep ? (
              <>
                <h2 className="text-center text-[24px] font-medium leading-[30px] text-black">
                  {channel === "whatsapp" ? t.otpTitleWa : t.otpTitleSms}
                </h2>
                <p className="mt-1 text-center text-[14px] leading-[21px] text-[#636363]">
                  {t.otpSent} {maskPhone(phone)}{" "}
                  <button
                    type="button"
                    onClick={onChangeNumber}
                    className="inline !h-auto !min-h-0 p-0 text-[14px] font-medium text-[#008080] underline"
                  >
                    {t.changeNumber}
                  </button>
                </p>

                <label className="mt-6 text-[14px] font-medium leading-5 text-black">{t.enterOtp}</label>
                <input
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otp.length === 4 && !isVerifyingOtp) {
                      e.preventDefault();
                      onVerify();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  autoFocus
                  aria-invalid={Boolean(otpError)}
                  className={`mt-[6px] h-14 w-full rounded-[40px] bg-[#F5F5F5] px-4 text-[16px] font-medium tabular-nums text-black outline-none ${fieldBorder(Boolean(otpError))}`}
                  style={{ letterSpacing: "0.45em" }}
                />
                {otpError ? (
                  <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                    {otpError}
                  </p>
                ) : null}

                <div className="mt-3 flex min-h-11 items-center gap-2 text-[14px] leading-[21px] text-black">
                  <span>{t.didntReceive}</span>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={!canResend || isSendingOtp}
                    className={`h-11 min-h-11 px-1 font-medium underline ${
                      canResend && !isSendingOtp ? "text-black" : "text-[#9E9E9E]"
                    }`}
                  >
                    {t.resend}
                  </button>
                  {!canResend ? (
                    <span className="inline-flex h-5 min-h-0 items-center rounded-full bg-[#F5F5F5] px-2 text-[10px] leading-[14px] text-[#636363] tabular-nums">
                      {secondsLeft} sec
                    </span>
                  ) : null}
                </div>

                <div className="mt-10 pb-6">
                  <button
                    type="button"
                    disabled={otp.length !== 4 || isVerifyingOtp}
                    onClick={onVerify}
                    className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[40px] bg-[#008080] text-[16px] font-medium text-white disabled:bg-[#7EBEBE]"
                  >
                    {isVerifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {isVerifyingOtp ? t.verifying : t.continue}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-center text-[24px] font-medium leading-[30px] text-black">
                  {greetingTitle}
                </h2>
                <p className="mt-1 text-center text-[14px] leading-[21px] text-[#636363]">{greetingBody}</p>

                <label className="mt-8 text-[14px] font-medium leading-5 text-black">
                  {isSignup ? t.name : t.nameOptional}
                </label>
                <input
                  value={ownerName}
                  onChange={(e) => onOwnerNameChange(e.target.value)}
                  placeholder={t.namePlaceholder}
                  autoComplete="name"
                  aria-invalid={Boolean(nameError)}
                  className={`mt-[6px] h-[46px] w-full rounded-[40px] bg-[#F5F5F5] px-4 text-[16px] text-black outline-none placeholder:text-[#C8C8C8] ${fieldBorder(Boolean(nameError))}`}
                />
                {nameError ? (
                  <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                    {nameError}
                  </p>
                ) : null}

                <label className="mt-6 text-[14px] font-medium leading-5 text-black">{t.phoneLabel}</label>
                <div className="mt-2 flex gap-1">
                  <div className="flex h-14 w-[84px] shrink-0 items-center justify-center gap-0.5 rounded-[40px] bg-[#F5F5F5]">
                    <span className="text-[20px] leading-none" aria-hidden>
                      🇮🇳
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#636363]" />
                  </div>
                  <div
                    className={`flex h-14 min-w-0 flex-1 items-center rounded-[40px] bg-[#F5F5F5] px-4 ${fieldBorder(Boolean(phoneError))}`}
                  >
                    <span className="shrink-0 text-[16px] font-medium text-black">+91</span>
                    <span className="mx-2 inline-block h-6 w-[3px] shrink-0 bg-[#DFDFDF]" />
                    <input
                      value={phone}
                      onChange={(e) => onPhoneChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSubmitPhone && !isSendingOtp) {
                          e.preventDefault();
                          onSendOtp();
                        }
                      }}
                      placeholder={t.phonePlaceholder}
                      inputMode="numeric"
                      autoComplete="tel"
                      aria-invalid={Boolean(phoneError)}
                      className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-[16px] tabular-nums text-black outline-none placeholder:text-[#C8C8C8]"
                    />
                  </div>
                </div>
                {phoneError ? (
                  <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                    {phoneError}
                  </p>
                ) : null}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChannel("whatsapp")}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-[40px] text-[12px] font-medium ${
                      channel === "whatsapp"
                        ? "border-[1.5px] border-[#008080] bg-[#E8FFFF] text-black"
                        : "border-[1.5px] border-transparent bg-[#F5F5F5] text-[#636363]"
                    }`}
                  >
                    <WhatsAppIcon />
                    {t.whatsapp}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChannel("sms")}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-[40px] text-[12px] font-medium ${
                      channel === "sms"
                        ? "border-[1.5px] border-[#008080] bg-[#E8FFFF] text-black"
                        : "border-[1.5px] border-transparent bg-[#F5F5F5] text-[#636363]"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t.sms}
                  </button>
                </div>

                <div className="mt-10 pb-6">
                  <button
                    type="button"
                    disabled={!canSubmitPhone || isSendingOtp}
                    onClick={onSendOtp}
                    className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[40px] bg-[#008080] text-[16px] font-medium text-white disabled:bg-[#7EBEBE]"
                  >
                    {isSendingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {isSendingOtp ? t.sending : t.getOtp}
                  </button>
                  <p className="mt-3 text-center text-[12px] leading-4 text-[#636363]">
                    {t.terms}{" "}
                    <Link to="/terms-and-conditions" className="underline">
                      {t.termsLink}
                    </Link>
                    {" & "}
                    <Link to="/privacy-policy" className="underline">
                      {t.privacyLink}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
