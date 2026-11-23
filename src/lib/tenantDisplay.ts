import type { PropertyTenant } from "@/api/propertyOwner";

export function tenantDisplayName(t?: PropertyTenant | null): string {
  if (!t) return "—";
  const n = t.name;
  return n != null && String(n).trim() !== "" ? String(n).trim() : "—";
}

export function tenantPhotoUrl(t?: any): string {
  if (!t) return "";

  const candidates: unknown[] = [
    t.photoUrl,
    t.profilePhotoUrl,
    t.profilePicture,
    t.profilePhoto,
    t.imageUrl,
    t.image,
    t.selfieUrl,
    t.selfie,
    t.profileImage,
    t.avatarUrl,
    t.avatar,
    t.photo,
    t.tenant?.photoUrl,
    t.tenant?.profilePhotoUrl,
    t.tenant?.imageUrl,
    t.tenant?.selfieUrl,
    t.roomTenant?.photoUrl,
    t.roomTenant?.profilePhotoUrl,
    t.roomTenant?.tenant?.photoUrl,
    t.roomTenant?.tenant?.profilePhotoUrl,
    t.roomTenant?.tenant?.selfieUrl,
    t.currentStay?.photoUrl,
    t.currentStay?.profilePhotoUrl,
    t.kycInfo?.selfieUrl,
    t.kycInfo?.photoUrl,
    t.kycInfo?.verifiedDetails?.photo,
    t.kyc?.selfieUrl,
    t.kyc?.photoUrl,
    t.personalDetails?.photoUrl,
    t.personalDetails?.profilePhotoUrl,
    t.personalDetails?.selfieUrl,
    t.kycInfo?.selfie,
    t.kycInfo?.profilePhoto,
  ];

  const documentBags = [t.documents, t.kycDocuments, t.files, t.tenant?.documents, t.kycInfo?.documents];
  for (const bag of documentBags) {
    if (!Array.isArray(bag)) continue;
    for (const doc of bag) {
      const kind = String(doc?.type || doc?.documentType || doc?.name || "").toLowerCase();
      if (kind.includes("photo") || kind.includes("selfie") || kind.includes("profile") || kind.includes("image")) {
        candidates.push(doc?.url, doc?.fileUrl, doc?.signedUrl, doc?.path);
      }
    }
  }

  let raw = "";
  for (const c of candidates) {
    const value =
      typeof c === "string"
        ? c
        : c && typeof c === "object"
          ? String((c as { url?: string; fileUrl?: string; signedUrl?: string }).url || (c as { fileUrl?: string }).fileUrl || (c as { signedUrl?: string }).signedUrl || "")
          : "";
    if (value.trim() && value.trim() !== "null" && value.trim() !== "undefined") {
      raw = value.trim();
      break;
    }
  }

  if (!raw) return "";

  // Convert insecure http:// to https:// to prevent mobile WebView mixed content block
  if (raw.startsWith("http://")) {
    raw = "https://" + raw.slice(7);
  }

  // Handle S3 key fallback if raw is a relative key
  if (
    !raw.startsWith("http") &&
    !raw.startsWith("data:") &&
    !raw.startsWith("blob:") &&
    !raw.startsWith("/")
  ) {
    return `https://pg-ease-qa.s3.ap-south-1.amazonaws.com/${raw}`;
  }

  return raw;
}

export function tenantInitials(t?: PropertyTenant | null): string {
  const n = tenantDisplayName(t);
  if (n === "—") return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function tenantPhone(t?: PropertyTenant | null): string {
  if (!t) return "—";
  const p = t.phone || t.mobileNumber || (t as any).contactNumber;
  return p != null && String(p).trim() !== "" ? String(p).trim() : "—";
}

export function tenantBlock(t?: any): string {
  if (!t) return "—";
  const b =
    (typeof t.block === "string" ? t.block : t.block?.name) ??
    t.currentStay?.block ??
    t.room?.block ??
    t.roomTenant?.block;
  return b != null && String(b).trim() !== "" && String(b).trim() !== "—" ? String(b).trim() : "—";
}

export function tenantFloor(t?: any): string {
  if (!t) return "—";
  const f =
    (typeof t.floor === "string" ? t.floor : t.floor?.name) ??
    t.currentStay?.floor ??
    t.room?.floor ??
    t.roomTenant?.floor;
  return f != null && String(f).trim() !== "" && String(f).trim() !== "—" ? String(f).trim() : "—";
}

export function tenantRoomNo(t?: any): string {
  if (!t) return "—";
  const r =
    t.roomNumber ??
    t.roomNo ??
    t.currentStay?.roomNumber ??
    t.currentStay?.roomName ??
    (typeof t.room === "string" ? t.room : t.room?.roomNumber ?? t.room?.name) ??
    t.roomTenant?.roomNumber;
  return r != null && String(r).trim() !== "" && String(r).trim() !== "—" ? String(r).trim() : "—";
}

export function tenantBedNo(t?: any): string {
  if (!t) return "—";
  const b =
    t.bedNumber ??
    t.bedNo ??
    t.currentStay?.bedNumber ??
    (typeof t.bed === "string" || typeof t.bed === "number" ? t.bed : t.bed?.bedNumber) ??
    t.roomTenant?.bedNumber ??
    t.roomTenant?.bedNumberOnAssignment;
  if (b === undefined || b === null || String(b).trim() === "" || String(b).trim() === "—") return "—";
  return String(b);
}

/** First positive money value from API fields. Skips 0 / empty so we never show a fake ₹0. */
export function pickPositiveMoney(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object") continue;
    const n = Number(String(v).replace(/[₹,\s]/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function tenantMonthlyRentValue(t?: any): number | null {
  if (!t) return null;
  const stay = t.currentStay || {};
  const rt = t.roomTenant || {};
  const pay = t.paymentDetails || {};
  return pickPositiveMoney(
    t.monthlyRent,
    t.rentAmount,
    t.rent,
    t.fixedRent,
    t.fixedMonthlyRent,
    stay.rentAmount,
    stay.monthlyRent,
    stay.rent,
    rt.rentAmount,
    rt.monthlyRent,
    rt.rent,
    pay.monthlyRent,
    pay.rentAmount,
    pay.fixedRent,
    pay.rent
  );
}

export function tenantSecurityDepositValue(t?: any): number | null {
  if (!t) return null;
  const stay = t.currentStay || {};
  const rt = t.roomTenant || {};
  const pay = t.paymentDetails || {};
  return pickPositiveMoney(
    t.securityDeposit,
    t.deposit,
    t.fixedDeposit,
    stay.securityDeposit,
    stay.deposit,
    rt.securityDeposit,
    rt.deposit,
    pay.securityDeposit,
    pay.deposit
  );
}

export function tenantJoiningFeeValue(t?: any): number | null {
  if (!t) return null;
  const stay = t.currentStay || {};
  const rt = t.roomTenant || {};
  const pay = t.paymentDetails || {};
  return pickPositiveMoney(
    t.joiningFee,
    t.miscellaneousFees,
    stay.joiningFee,
    stay.miscellaneousFees,
    rt.joiningFee,
    rt.miscellaneousFees,
    pay.joiningFee
  );
}

export function formatMoneyOrDash(n?: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function tenantRentAmount(t?: any): string {
  const n = tenantMonthlyRentValue(t);
  return n ? `${formatMoneyOrDash(n)}/mo` : "—";
}

/** Next rent due on same calendar day as `rentDueDate` or `startDate` (monthly, DD MMM YYYY). */
export function tenantRentDueLabel(t?: any): string {
  if (!t) return "—";

  // 1. First priority: cycle due day (1-31)
  const rawDueDay = Number(
    t.rentDueDate ??
    t.currentStay?.rentDueDate ??
    t.roomTenant?.rentDueDate
  );

  // 2. Second priority: start / joining date
  const startIso =
    t.joiningDate ??
    t.moveInDate ??
    t.currentStay?.startDate ??
    t.roomTenant?.startDate ??
    t.startDate;

  let day = 1;
  if (Number.isFinite(rawDueDay) && rawDueDay >= 1 && rawDueDay <= 31) {
    day = rawDueDay;
  } else if (startIso) {
    const start = new Date(startIso);
    if (!Number.isNaN(start.getTime())) {
      day = start.getDate();
    }
  }

  const now = new Date();
  let y = now.getFullYear();
  let mo = now.getMonth();

  // Create date for this month's due day
  const daysInCurrentMonth = new Date(y, mo + 1, 0).getDate();
  let candidate = new Date(y, mo, Math.min(day, daysInCurrentMonth));

  const status = String(t.rentStatus || t.paymentStatus || t.collectionStatus || "").toLowerCase();
  const outstanding = Number(
    t.outstanding ?? t.pendingAmount ?? t.amountOutstanding ?? t.dueAmount ?? NaN,
  );
  const currentMonthUnpaid =
    status === "unpaid" ||
    status === "pending" ||
    status === "partial" ||
    status === "overdue" ||
    (Number.isFinite(outstanding) && outstanding > 0);

  // An unpaid month stays the next due, even after that calendar day has passed.
  if (!currentMonthUnpaid && candidate <= now) {
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
    const daysInNextMonth = new Date(y, mo + 1, 0).getDate();
    candidate = new Date(y, mo, Math.min(day, daysInNextMonth));
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dStr = candidate.getDate().toString().padStart(2, "0");
  const mStr = monthNames[candidate.getMonth()];
  const yStr = candidate.getFullYear();
  return `${dStr} ${mStr} ${yStr}`;
}

export function tenantVerificationLabel(t?: PropertyTenant | null): "verified" | "pending" {
  if (!t) return "pending";
  if (
    t.kycVerified === true ||
    t.aadhaarVerified === true ||
    (t as any).isKycVerified === true ||
    (t as any).kycStatus === "completed" ||
    (t as any).kycStatus === "approved" ||
    (t as any).kyc?.status === "completed" ||
    (t as any).kyc?.status === "approved" ||
    (t as any).kycInfo?.status === "completed" ||
    (t as any).kycInfo?.status === "approved"
  ) {
    return "verified";
  }
  return "pending";
}

/** signed, pending, or unknown when the stay has no agreement record yet. */
export function tenantAgreementState(t?: any): "signed" | "pending" | "unknown" {
  if (!t) return "unknown";
  const raw =
    t.agreementStatus ??
    t.rentAgreementStatus ??
    t.agreement?.status ??
    t.roomTenant?.agreementStatus ??
    t.roomTenant?.agreement?.status ??
    t.currentStay?.agreementStatus;
  if (t.agreementSigned === true || t.isAgreementSigned === true) return "signed";
  if (raw == null || String(raw).trim() === "") return "unknown";
  const status = String(raw).toLowerCase();
  if (["signed", "completed", "executed", "active"].some((key) => status.includes(key))) return "signed";
  return "pending";
}

export type TenantStayState = "ACTIVE" | "UNDER_NOTICE" | "MOVED_OUT";

export function tenantStayStatus(t?: any): TenantStayState {
  if (!t) return "ACTIVE";
  const rawStatus = (
    t.status ||
    t.roomTenant?.status ||
    t.currentStay?.status ||
    ""
  ).toUpperCase();

  if (rawStatus === "MOVED_OUT" || t.isMovedOut || t.roomTenant?.isMovedOut || t.vacated) {
    return "MOVED_OUT";
  }

  if (
    rawStatus === "UNDER_NOTICE" ||
    t.isOnNotice === true ||
    t.roomTenant?.isOnNotice === true ||
    t.currentStay?.isOnNotice === true ||
    Boolean(t.noticeRaisedOn || t.roomTenant?.noticeRaisedOn)
  ) {
    return "UNDER_NOTICE";
  }

  return "ACTIVE";
}

export function tenantMoveOutDate(t?: any): string | null {
  if (!t) return null;
  return (
    t.moveOutDate ||
    t.roomTenant?.moveOutDate ||
    t.currentStay?.moveOutDate ||
    t.vacateOn ||
    t.roomTenant?.vacateOn ||
    t.expectedMoveOutDate ||
    null
  );
}

export function tenantNoticeRaisedDate(t?: any): string | null {
  if (!t) return null;
  return (
    t.noticeRaisedOn ||
    t.roomTenant?.noticeRaisedOn ||
    t.currentStay?.noticeRaisedOn ||
    t.noticeGivenAt ||
    null
  );
}

export function tenantCode(t?: any): string {
  if (!t) return "";
  return String(t.tenantCode || t.roomTenant?.tenantCode || t.code || "").trim();
}

export function tenantGender(t?: any): string {
  if (!t) return "";
  const g = t.gender || t.roomTenant?.gender;
  if (!g) return "";
  return String(g).charAt(0).toUpperCase() + String(g).slice(1).toLowerCase();
}

export function tenantDob(t?: any): string {
  if (!t) return "";
  const d = t.dob || t.dateOfBirth || t.roomTenant?.dob;
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  } catch {
    // fallback
  }
  return String(d);
}

export function tenantBankName(t?: any): string {
  if (!t) return "";
  return String(t.bankName || t.bankDetails?.bankName || t.roomTenant?.bankName || "").trim();
}

export function tenantStatusDisplay(t?: any): {
  status: TenantStayState;
  label: string;
  badgeClass: string;
} {
  const status = tenantStayStatus(t);
  const moveOut = tenantMoveOutDate(t);

  if (status === "UNDER_NOTICE") {
    let moveOutFormatted = "";
    if (moveOut) {
      try {
        const dt = new Date(moveOut);
        if (!isNaN(dt.getTime())) {
          moveOutFormatted = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        }
      } catch {
        moveOutFormatted = String(moveOut).split("T")[0];
      }
    }
    return {
      status: "UNDER_NOTICE",
      label: moveOutFormatted ? `On Notice (Vacating ${moveOutFormatted})` : "On Notice",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800",
    };
  }

  if (status === "MOVED_OUT") {
    return {
      status: "MOVED_OUT",
      label: "Moved Out",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
    };
  }

  return {
    status: "ACTIVE",
    label: "Active Stay",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
  };
}
