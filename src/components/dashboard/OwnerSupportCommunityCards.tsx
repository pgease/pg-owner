import React, { useState } from "react";
import {
  Phone,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { AccountManagerModal } from "@/components/common/AccountManagerModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  supportWhatsAppUrl,
} from "@/config/links";

export const OwnerSupportCommunityCards: React.FC = () => {
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const whatsappCommunityUrl =
    "https://whatsapp.com/channel/0029VbCFK1QATRSlDPtgms2e";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
      {/* Section Header */}
      <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h3 className="text-lg sm:text-[19px] font-bold text-slate-900 tracking-tight">
            Smart Tools & Community
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500">
            Direct access to dedicated assistance, owner network, tutorials & 24/7 help.
          </p>
        </div>
      </div>

      {/* 4 Block Cards Grid (Matching reference image style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: WhatsApp Community */}
        <a
          href={whatsappCommunityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#E8FAF3] border border-[#CFF5E4] p-4 sm:p-5 h-[200px] sm:h-[220px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/5 cursor-pointer overflow-hidden"
          title="Join PG Ease Owners WhatsApp Community"
        >
          <div>
            <h4 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
              PG Ease
              <br />
              WhatsApp Community
            </h4>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Offer & Updates
            </span>
          </div>

          {/* 3D Smartphone Illustration with WhatsApp Group */}
          <div className="relative mx-auto w-full flex items-center justify-center pt-2">
            <svg
              className="w-24 sm:w-28 h-24 sm:h-28 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Phone Body */}
              <rect
                x="30"
                y="10"
                width="60"
                height="100"
                rx="14"
                fill="#FFFFFF"
                stroke="#1E293B"
                strokeWidth="3"
              />
              {/* Phone Notch/Speaker */}
              <rect x="48" y="16" width="24" height="3" rx="1.5" fill="#94A3B8" />

              {/* Screen Area */}
              <rect x="34" y="24" width="52" height="80" rx="8" fill="#F8FAFC" />

              {/* WhatsApp Header in Screen */}
              <rect x="34" y="24" width="52" height="18" rx="8" fill="#128C7E" />
              <rect x="34" y="34" width="52" height="8" fill="#128C7E" />
              <circle cx="44" cy="33" r="5" fill="#25D366" />
              <rect x="52" y="30" width="26" height="3" rx="1.5" fill="#FFFFFF" />
              <rect x="52" y="35" width="16" height="2" rx="1" fill="#E2E8F0" />

              {/* Chat Bubbles */}
              {/* Incoming Bubble */}
              <rect x="38" y="47" width="34" height="12" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="42" y="51" width="24" height="2" rx="1" fill="#64748B" />
              <rect x="42" y="55" width="16" height="2" rx="1" fill="#94A3B8" />

              {/* Outgoing WhatsApp Bubble */}
              <rect x="46" y="63" width="36" height="14" rx="4" fill="#DCF8C6" stroke="#C3EAA4" strokeWidth="1" />
              <rect x="50" y="67" width="26" height="2" rx="1" fill="#1E293B" />
              <rect x="50" y="71" width="18" height="2" rx="1" fill="#475569" />

              {/* Big Floating 3D WhatsApp Badge */}
              <g transform="translate(64, 62)">
                <circle cx="18" cy="18" r="16" fill="#25D366" filter="drop-shadow(0px 4px 6px rgba(37,211,102,0.4))" />
                <path
                  d="M24 16.5c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.2-.4.1-1.3-.7-2.2-1.4-3-2.9-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.1 0-.4.1-.5.3-.2.2-.7.7-.7 1.7 0 1 .7 2 1 2.2.1.1 1.4 2.2 3.5 3.1 1.4.6 1.9.6 2.6.5.7-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.4-.3z"
                  fill="#FFFFFF"
                />
              </g>
            </svg>
          </div>
        </a>

        {/* Card 2: Dedicated Account Manager */}
        <div
          onClick={() => setManagerModalOpen(true)}
          className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#F4F0FF] border border-[#E5DBFF] p-4 sm:p-5 h-[200px] sm:h-[220px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/5 cursor-pointer overflow-hidden"
          title="Connect with Rahul Sharma (Senior PG Specialist)"
        >
          <div>
            <h4 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
              Your Personal
              <br />
              Account Manager
            </h4>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-purple-600/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-purple-700">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Call / Contact
            </span>
          </div>

          {/* 3D Dedicated Manager / Support Specialist Card Illustration */}
          <div className="relative mx-auto w-full flex items-center justify-center pt-2">
            <svg
              className="w-24 sm:w-28 h-24 sm:h-28 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Glow Badge */}
              <circle cx="60" cy="58" r="40" fill="#E9D8FD" />
              <circle cx="60" cy="58" r="32" fill="#D6BCFA" />

              {/* Headset arc */}
              <path
                d="M36 56C36 42.745 46.745 32 60 32C73.255 32 84 42.745 84 56"
                stroke="#6B46C1"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Headset Ear Cushions */}
              <rect x="32" y="52" width="7" height="15" rx="3.5" fill="#553C9A" />
              <rect x="81" y="52" width="7" height="15" rx="3.5" fill="#553C9A" />
              {/* Mic wire */}
              <path d="M36 65C36 74 46 76 52 76" stroke="#553C9A" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="53" cy="76" r="3" fill="#319795" />

              {/* Manager Avatar Icon */}
              <circle cx="60" cy="50" r="14" fill="#6B46C1" />
              {/* Face/Initials */}
              <text x="60" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                RS
              </text>
              {/* Torso/Shoulders */}
              <path d="M42 78C42 68 50 66 60 66C70 66 78 68 78 78" fill="#553C9A" />

              {/* Floating Call Pill */}
              <g transform="translate(24, 76)">
                <rect width="72" height="24" rx="12" fill="#FFFFFF" stroke="#D6BCFA" strokeWidth="2" filter="drop-shadow(0px 2px 4px rgba(107,70,193,0.15))" />
                <circle cx="14" cy="12" r="7" fill="#10B981" />
                <path d="M11.5 10.5C11.5 13 13 14.5 15.5 14.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                <text x="44" y="15" textAnchor="middle" fill="#4A5568" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                  Anil Singh
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Card 3: Tutorial help.pgease.com page */}
        <a
          href="https://help.pgease.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#EBF5FE] border border-[#D0E9FD] p-4 sm:p-5 h-[200px] sm:h-[220px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/5 cursor-pointer overflow-hidden"
          title="Video Guides & Tutorials at help.pgease.com"
        >
          <div>
            <h4 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
              Youtube Guide &
              <br />
              Tutorial
            </h4>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-blue-700">
              <ExternalLink className="h-3 w-3" />
              Video Guides
            </span>
          </div>

          {/* 3D Browser Window with Play Video (similar to 'My Website' in reference image) */}
          <div className="relative mx-auto w-full flex items-center justify-center pt-2">
            <svg
              className="w-24 sm:w-28 h-24 sm:h-28 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Browser Window Frame */}
              <rect
                x="15"
                y="22"
                width="90"
                height="74"
                rx="10"
                fill="#FFFFFF"
                stroke="#2563EB"
                strokeWidth="2.5"
              />
              {/* Browser Header Bar */}
              <rect x="15" y="22" width="90" height="18" rx="10" fill="#DBEAFE" />
              <rect x="15" y="32" width="90" height="8" fill="#DBEAFE" />
              {/* 3 Traffic Dots */}
              <circle cx="25" cy="31" r="2.5" fill="#EF4444" />
              <circle cx="33" cy="31" r="2.5" fill="#F59E0B" />
              <circle cx="41" cy="31" r="2.5" fill="#10B981" />

              {/* Address bar pill */}
              <rect x="49" y="27" width="48" height="8" rx="4" fill="#FFFFFF" />
              <text x="53" y="33.5" fill="#3B82F6" fontSize="5.5" fontWeight="600" fontFamily="sans-serif">
                help.pgease.com
              </text>

              {/* Inside Screen Video Player */}
              <rect x="22" y="46" width="76" height="42" rx="6" fill="#1E293B" />
              <rect x="22" y="46" width="76" height="42" rx="6" fill="url(#videoGradient)" />

              {/* Big Red/White 3D Play Button */}
              <circle cx="60" cy="67" r="12" fill="#EF4444" filter="drop-shadow(0px 3px 6px rgba(239,68,68,0.5))" />
              <polygon points="57,61 67,67 57,73" fill="#FFFFFF" />

              {/* Video Progress Line */}
              <rect x="28" y="82" width="64" height="2" rx="1" fill="#475569" />
              <rect x="28" y="82" width="28" height="2" rx="1" fill="#EF4444" />

              <defs>
                <linearGradient id="videoGradient" x1="22" y1="46" x2="98" y2="88" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1E3A8A" stopOpacity="0.8" />
                  <stop stopColor="#0F172A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </a>

        {/* Card 4: Help and Support */}
        <div
          onClick={() => setSupportModalOpen(true)}
          className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#FFF9EC] border border-[#FDE8BF] p-4 sm:p-5 h-[200px] sm:h-[220px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/5 cursor-pointer overflow-hidden"
          title="24/7 PG Ease Help and Support Desk"
        >
          <div>
            <h4 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
              Help and
              <br />
              Support
            </h4>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-600/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-800">
              <Clock className="h-3 w-3" />
              24/7 Support
            </span>
          </div>

          {/* 3D Help Desk & Customer Support Illustration */}
          <div className="relative mx-auto w-full flex items-center justify-center pt-2">
            <svg
              className="w-24 sm:w-28 h-24 sm:h-28 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soft warm circular backdrop */}
              <circle cx="60" cy="60" r="38" fill="#FEEBC8" />

              {/* 3D Lifebuoy / Support Ring */}
              <circle cx="60" cy="60" r="28" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="8" />
              <path d="M60 24L60 36" stroke="#EA580C" strokeWidth="8" strokeLinecap="round" />
              <path d="M60 84L60 96" stroke="#EA580C" strokeWidth="8" strokeLinecap="round" />
              <path d="M24 60L36 60" stroke="#EA580C" strokeWidth="8" strokeLinecap="round" />
              <path d="M84 60L96 60" stroke="#EA580C" strokeWidth="8" strokeLinecap="round" />

              {/* Center Lifebuoy Hole */}
              <circle cx="60" cy="60" r="14" fill="#FFF9EC" stroke="#FDE8BF" strokeWidth="2" />

              {/* Headset Over Lifebuoy */}
              <path
                d="M40 56C40 45 49 38 60 38C71 38 80 45 80 56"
                stroke="#D97706"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <rect x="36" y="52" width="6" height="12" rx="3" fill="#B45309" />
              <rect x="78" y="52" width="6" height="12" rx="3" fill="#B45309" />

              {/* Floating '24x7 Help' Speech Bubble */}
              <g transform="translate(48, 62)">
                <rect width="48" height="22" rx="11" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" filter="drop-shadow(0px 3px 5px rgba(217,119,6,0.2))" />
                <text x="24" y="15" textAnchor="middle" fill="#B45309" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                  24x7 Help
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Account Manager Modal */}
      <AccountManagerModal
        open={managerModalOpen}
        onOpenChange={setManagerModalOpen}
      />

      {/* Help & Support Quick Contact Modal */}
      <Dialog open={supportModalOpen} onOpenChange={setSupportModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Priority Support Desk
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 pt-1">
              PG Ease Help & Support
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Need immediate troubleshooting, billing support, or have operational queries?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">Official Helpline</h5>
                  <p className="text-xs text-slate-500">Mon – Sat (9:30 AM – 7:00 PM IST)</p>
                </div>
                <span className="text-xs font-bold text-teal-700">{SUPPORT_PHONE_DISPLAY}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                  asChild
                >
                  <a href={SUPPORT_PHONE_TEL}>
                    <Phone className="h-4 w-4" />
                    Direct Call
                  </a>
                </Button>

                <Button
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                  asChild
                >
                  <a
                    href={supportWhatsAppUrl("Hi PG Ease Support, I need help with my PG owner account.")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 flex items-center justify-between">
              <div>
                <h6 className="text-xs font-semibold text-slate-900">Knowledge Base & Tutorials</h6>
                <p className="text-[11px] text-slate-500">Video guides for bed setup & rent invoices</p>
              </div>
              <a
                href="https://help.pgease.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                <span>help.pgease.com</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSupportModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900 rounded-xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
