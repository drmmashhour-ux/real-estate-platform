import type { SyriaListingPlan } from "@/generated/prisma";
import { toWhatsAppPath } from "@/lib/syria-phone";

/** Manual باقة مميز/فاخر — SYP, no external gateway. */
export const F1_PLAN_PRICES_SYP = {
  featured: 50_000,
  premium: 120_000,
} as const;

/** Alias for Financial Core (FI) integration docs. */
export const FI_MANUAL_PRICES_SYP = F1_PLAN_PRICES_SYP;

export type F1PlanKey = keyof typeof F1_PLAN_PRICES_SYP;

const tier: Record<SyriaListingPlan, number> = {
  free: 0,
  featured: 1,
  premium: 2,
};

export function f1AmountForPlan(plan: F1PlanKey): number {
  return F1_PLAN_PRICES_SYP[plan];
}

/** True if listing can request an upgrade to `target` (no downgrades; premium is top). */
export function f1CanRequestPlan(current: SyriaListingPlan, target: F1PlanKey): boolean {
  if (target === "featured") return current === "free";
  if (target === "premium") return current === "free" || current === "featured";
  return false;
}

export function f1PlanStronger(a: SyriaListingPlan, b: SyriaListingPlan): SyriaListingPlan {
  return tier[a] >= tier[b] ? a : b;
}

/** Arabic proof line — admin matches `requestId` to the payment request row. */
export function f1BuildWhatsAppPaymentText(listingId: string, requestId: string): string {
  return `قمت بالدفع للإعلان رقم ${listingId}\nرقم الطلب: ${requestId}`;
}

export function f1BuildWhatsAppPaymentTextEn(listingId: string, requestId: string): string {
  return `I paid for listing ${listingId}\nRequest ID: ${requestId}`;
}

/** `wa.me` to admin with proof text; `phoneRaw` = env admin phone. */
export function f1BuildWhatsAppUrl(phoneRaw: string, text: string): string | null {
  const path = toWhatsAppPath(phoneRaw);
  if (!path) return null;
  return `https://wa.me/${path}?text=${encodeURIComponent(text)}`;
}
