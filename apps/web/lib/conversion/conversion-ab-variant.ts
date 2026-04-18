/**
 * Deterministic session A/B variants for conversion experiments (client-only reads).
 */

export type ConversionAbVariant = "a" | "b";

const SUBMIT_KEY = "conv:ab:get_leads_submit_cta";

export function getLeadsSubmitCtaVariant(): ConversionAbVariant {
  if (typeof window === "undefined") return "a";
  try {
    const v = sessionStorage.getItem(SUBMIT_KEY);
    if (v === "a" || v === "b") return v;
    const next: ConversionAbVariant = Math.random() < 0.5 ? "a" : "b";
    sessionStorage.setItem(SUBMIT_KEY, next);
    return next;
  } catch {
    return "a";
  }
}

export function getLeadsSubmitButtonLabel(variant: ConversionAbVariant): string {
  return variant === "b"
    ? "Get matched with properties now"
    : "Get matched now — free intake";
}
