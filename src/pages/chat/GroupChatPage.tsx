import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BellRing,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Lock,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";

export default function GroupChatPage() {
  const { selectedPgId, properties } = useApp();
  const property = properties.find((p) => p.id === selectedPgId);
  const propertyName = property?.name || "Your PG";

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Resident & Community Chat
            </h1>
            <Badge className="bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs px-3 py-1 shadow-sm">
              Coming Soon 🚀
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            The unified real-time communication platform connecting PG Owners, Property Staff, and Verified Tenants for{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{propertyName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">← Back to Dashboard</Link>
          </Button>
          <Button className="bg-[#008080] hover:bg-[#006666] text-white" asChild>
            <Link to="/my-pgs/notices">Manage Notice Board</Link>
          </Button>
        </div>
      </div>

      {/* Hero Showcase with Interactive Mockup */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-950 via-[#004d4d] to-slate-950 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-3.5 py-1 text-xs font-semibold text-teal-200 border border-teal-400/30">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Next Major Feature Release
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Connect Owners, Staff & All Tenants in One Centralized Hub
            </h2>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Say goodbye to unorganized WhatsApp groups, leaked personal phone numbers, and chasing unpaid rent manually.
              PG Ease Resident Chat brings verified tenants, caretakers, and owners into a secure, synchronized channel with direct notice broadcasts, rent due tagging, and instant photo sharing.
            </p>

            {/* Quick highlight pills */}
            <div className="pt-2 flex flex-wrap gap-2 justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-300" /> Zero Phone Number Leaks
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 border border-white/10 backdrop-blur-xs">
                <IndianRupee className="h-3.5 w-3.5 text-amber-300" /> @Tenant Dues Reminders
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 border border-white/10 backdrop-blur-xs">
                <Megaphone className="h-3.5 w-3.5 text-emerald-300" /> Instant PG Notice Broadcasts
              </span>
            </div>
          </div>

          {/* Right Live-like Chat Mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="mx-auto max-w-md rounded-2xl border border-white/20 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 font-sans text-xs">
              {/* Mockup Header */}
              <div className="flex items-center justify-between bg-teal-800/80 px-4 py-3 border-b border-teal-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 font-bold text-white text-xs">
                    🏢
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[13px] leading-tight truncate">
                      {propertyName} Community
                    </p>
                    <p className="text-[10px] text-teal-200">
                      48 Verified Members · Active Now
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                  Verified PG Hub
                </Badge>
              </div>

              {/* Mockup Chat Body */}
              <div className="p-3.5 space-y-3 bg-slate-950/60 max-h-[300px] overflow-y-auto">
                {/* Message 1: Official Broadcast by Owner */}
                <div className="rounded-xl bg-teal-900/40 border border-teal-500/30 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-teal-300 flex items-center gap-1">
                      📢 PG Management Broadcast
                    </span>
                    <span className="text-slate-400">10:15 AM</span>
                  </div>
                  <p className="text-slate-200 leading-snug">
                    Overhead water tank cleaning is scheduled tomorrow between 10:00 AM – 1:00 PM. Please store adequate drinking water.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-teal-500/20 text-[10px] text-teal-300/80">
                    <span>Delivered to all 48 residents</span>
                    <span className="font-semibold">✓✓ 46 Read</span>
                  </div>
                </div>

                {/* Message 2: Owner tagging resident with dues */}
                <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      💳 Dues Reminder
                    </span>
                    <span className="text-slate-400">11:30 AM</span>
                  </div>
                  <p className="text-slate-200 leading-snug">
                    <span className="font-bold text-amber-200 bg-amber-500/20 px-1 py-0.5 rounded">@Rahul Sharma (Room 204)</span> — Friendly reminder that your rent for Nov 2026 (<span className="font-semibold text-emerald-400">₹8,500</span>) is due.
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                    <IndianRupee className="h-3 w-3" /> Quick Pay via UPI / Netbanking
                  </div>
                </div>

                {/* Message 3: Tenant replying with receipt */}
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-2.5 space-y-1 ml-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-teal-300">Rahul Sharma (Room 204)</span>
                    <span className="text-slate-400">11:42 AM</span>
                  </div>
                  <p className="text-slate-300 leading-snug">
                    Paid via UPI just now! Attached payment screenshot (UTR: 43219802).
                  </p>
                  <div className="flex items-center gap-2 rounded bg-slate-900/80 px-2 py-1 border border-slate-700/60 text-[10px] text-slate-300">
                    <Camera className="h-3 w-3 text-teal-400" /> screenshot_receipt_nov.jpg (240 KB)
                  </div>
                </div>
              </div>

              {/* Mockup Chat Input Footer */}
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 text-slate-400">
                <span className="p-1 rounded-md bg-slate-800 text-teal-400 font-bold">@</span>
                <span className="text-[11px] text-slate-400 flex-1">Type an announcement or mention @resident...</span>
                <div className="h-6 px-2.5 rounded bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                  Send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Value Pillars Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#008080]" />
              Why PG Ease Group Chat is a Game-Changer
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built specifically for Indian PG owners to automate community management and keep residents informed.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">6 Powerful Capabilities</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#008080] dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  1. Unified Community at One Place
                </h3>
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  Owner + Staff + All Tenants
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All residents, PG owners, caretakers, and wardens are brought together in one structured space. When a resident checks in, they are automatically added; upon move-out, they are securely unlisted.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  2. Direct Notice & Circular Broadcasts
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Guaranteed Read Visibility
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Broadcast critical PG updates with 1-click — including water/electricity timings, gate curfew changes, festival celebrations, and repair alerts. Track real-time seen receipts effortlessly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  3. Tag Residents for Unpaid Rent
                </h3>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Smart @Tenant Dues Reminders
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No more awkward manual phone calls. Tag residents with pending monthly rent or electricity dues (<span className="font-semibold text-slate-800 dark:text-slate-200">@ResidentName</span>) with an instant payment link so dues are settled in seconds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  4. Privacy Protection & Zero Number Leaks
                </h3>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  Masked Mobile Numbers
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlike public WhatsApp groups where phone numbers are exposed to strangers, PG Ease chat keeps resident contact numbers masked. Residents coordinate safely without spam or harassment.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  5. Photo Proofs, Bills & Meter Readings
                </h3>
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                  Instant Media & UTR Receipts
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Residents can share photos of maintenance repairs, sub-meter readings, and payment UTR screenshots directly in the chat with automated timestamps for complete financial transparency.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 transition-all hover:border-teal-500/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  6. 1-Tap Emergency Alerts & Meal Polls
                </h3>
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                  Gate Assistance & Interactive Voting
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instant 1-tap SOS buzz for late-night gate lockouts or urgent repairs. Plus, run quick interactive polls for Sunday lunch menus, Wi-Fi performance, and PG amenities feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Traditional WhatsApp vs PG Ease Resident Chat */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Why PG Owners Prefer PG Ease Chat Over WhatsApp Groups
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Designed specifically to eliminate the daily operational chaos of running an Indian hostel or PG.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-4">Feature / Capability</th>
                <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400">PG Ease Verified Hub</th>
                <th className="py-3 px-4 text-slate-500">Scattered WhatsApp Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Tenant Member Roster
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Auto-sync with Check-ins & Move-outs
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  Manual. Ex-tenants remain in group for months.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Resident Phone Number Privacy
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> 100% Masked numbers, safe & verified
                </td>
                <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                  Leaked to everyone, high spam risk
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Pending Rent Dues Reminders
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Direct @Tenant tagging with 1-tap UPI link
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  Manual chasing, awkward group shaming
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Official Notice Visibility
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Pinned announcements with read status
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  Buried under "Good Morning" spam texts
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Integration with PG Records
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Connected to Rooms, Beds & Accounting
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  Completely disconnected external app
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Early Access / Ready Tools Footer Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-teal-950/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <BadgeCheck className="h-5 w-5 text-[#008080]" />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Early Access Enabled For Your Account
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            This feature will be rolled out automatically to <strong className="text-slate-800 dark:text-slate-200">{propertyName}</strong> upon official launch at no additional cost. In the meantime, broadcast notices directly via the Digital Notice Board!
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" asChild>
            <Link to="/rent-payments/dues">Track Rent Dues</Link>
          </Button>
          <Button className="bg-[#008080] hover:bg-[#006666] text-white" asChild>
            <Link to="/my-pgs/notices">Post PG Notice →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
