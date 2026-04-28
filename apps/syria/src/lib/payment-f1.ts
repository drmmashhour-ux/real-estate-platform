import { f1AmountForPlanFromViews, f1ViewTierAndPrices, F1_BASELINE_SYP, F1_LADDER_CAP_SYP } from "@/config/syria-f1-pricing.config";
import type { SyriaListingPlan } from "@/generated/prisma";
import { formatSyriaCurrency } from "@/lib/format";
import { toWhatsAppPath } from "@/lib/syria-phone";

/** Baseline (tier 0) — docs / display fallback. */
export const F1_PLAN_PRICES_SYP = F1_BASELINE_SYP;

export const F1_PRICE_CAPS_SYP = F1_LADDER_CAP_SYP;

/** Alias for Financial Core (FI) integration docs. */
export const FI_MANUAL_PRICES_SYP = F1_PLAN_PRICES_SYP;

export { f1ViewTierAndPrices, f1AmountForPlanFromViews } from "@/config/syria-f1-pricing.config";

export type F1PlanKey = keyof typeof F1_BASELINE_SYP;

const tier: Record<SyriaListingPlan, number> = {
  free: 0,
  featured: 1,
  premium: 2,
  hotel_featured: 3,
};

/**
 * F1 price for a plan from **public view count** (must match server at payment-request time).
 * @param views — optional; when missing, uses tier 0 (same as 0 views).
 */
export function f1AmountForPlan(plan: F1PlanKey, views?: number): number {
  return f1AmountForPlanFromViews(plan, views ?? 0);
}

/** True if listing can request an upgrade to `target` (no downgrades; premium is top). */
export function f1CanRequestPlan(current: SyriaListingPlan, target: F1PlanKey): boolean {
  /** SYBNB-41 hotel subscriptions are activated manually — no self-serve F1 swap-down. */
  if (current === "hotel_featured") return false;
  if (target === "featured") return current === "free";
  if (target === "premium") return current === "free" || current === "featured";
  return false;
}

export function f1PlanStronger(a: SyriaListingPlan, b: SyriaListingPlan): SyriaListingPlan {
  return tier[a] >= tier[b] ? a : b;
}

/** SYBNB-133 — Short Arabic-first WA prefill: intent, ids, price, optional scarcity line, payment-details ask; keeps request id for ops. */
export function f1BuildWhatsAppPaymentText(
  listingDisplayId: string,
  plan: F1PlanKey,
  amountSyp: number,
  requestId: string,
): string {
  const planAr = plan === "premium" ? "فاخر" : "مميز";
  const price = formatSyriaCurrency(amountSyp, "SYP", "ar");
  return [
    "مرحبا 👋",
    `أرغب بترقية هذا الإعلان إلى ${planAr}`,
    "",
    `📌 رقم الإعلان: ${listingDisplayId}`,
    `📦 الخطة: ${planAr}`,
    `💰 السعر: ${price}`,
    "",
    "إذا متوفر حالياً",
    "",
    "هل يمكن تأكيد الطلب؟",
    "",
    "أرسل لي تفاصيل الدفع 👍",
    "",
    `📋 رقم الطلب: ${requestId}`,
  ].join("\n");
}

export function f1BuildWhatsAppPaymentTextEn(
  listingDisplayId: string,
  plan: F1PlanKey,
  amountSyp: number,
  requestId: string,
): string {
  const planEn = plan === "premium" ? "Premium" : "Featured";
  const price = formatSyriaCurrency(amountSyp, "SYP", "en");
  return [
    "Hi 👋",
    `I'd like to upgrade this listing to ${planEn}`,
    "",
    `📌 Listing ID: ${listingDisplayId}`,
    `📦 Plan: ${planEn}`,
    `💰 Price: ${price}`,
    "",
    "If available now",
    "",
    "Can you confirm the request?",
    "",
    "Send me payment details 👍",
    "",
    `📋 Request ID: ${requestId}`,
  ].join("\n");
}

/** `wa.me` to admin with proof text; `phoneRaw` = env admin phone. */
export function f1BuildWhatsAppUrl(phoneRaw: string, text: string): string | null {
  const path = toWhatsAppPath(phoneRaw);
  if (!path) return null;
  return `https://wa.me/${path}?text=${encodeURIComponent(text)}`;
}
