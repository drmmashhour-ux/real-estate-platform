import type { InsuranceLeadStatus } from "@prisma/client";

/**
 * UI labels for `InsuranceLeadStatus` — aligned with broker workflow wording.
 * DB values remain the Prisma enum (honest; not a substitute for issued policies).
 */
export function insuranceStatusUiLabel(status: InsuranceLeadStatus): string {
  switch (status) {
    case "NEW":
      return "New";
    case "CONTACTED":
      return "Contacted";
    case "SENT":
      return "Quoted";
    case "CONVERTED":
      return "Closed";
    case "REJECTED":
      return "Declined";
    default:
      return status;
  }
}

export function insuranceStatusBadgeClass(status: InsuranceLeadStatus): string {
  switch (status) {
    case "NEW":
      return "border-sky-500/40 bg-sky-950/40 text-sky-100";
    case "CONTACTED":
      return "border-amber-500/35 bg-amber-950/35 text-amber-100";
    case "SENT":
      return "border-premium-gold/45 bg-[#2a2310]/80 text-[#F0E6C8]";
    case "CONVERTED":
      return "border-emerald-500/40 bg-emerald-950/40 text-emerald-100";
    case "REJECTED":
      return "border-slate-600 bg-slate-900/80 text-slate-400";
    default:
      return "border-white/15 bg-white/5 text-slate-200";
  }
}
