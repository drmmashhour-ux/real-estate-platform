import type { SerializableInvestmentDeal } from "@/lib/investment/investment-deal-types";
import { buildSampleDemoDeals } from "@/lib/investment/demo-deals-data";

export const DEMO_DEALS_STORAGE_KEY = "lecipm_investment_demo_deals_v2";

function safeParse(raw: string | null): SerializableInvestmentDeal[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return data.filter(isValidDeal);
  } catch {
    return null;
  }
}

function isValidDeal(x: unknown): x is SerializableInvestmentDeal {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const rt = o.rentalType;
  const ps = o.preferredStrategy;
  if (rt !== undefined && rt !== "LONG_TERM" && rt !== "SHORT_TERM") return false;
  if (ps !== undefined && ps !== "LONG_TERM" && ps !== "SHORT_TERM") return false;
  return (
    typeof o.id === "string" &&
    typeof o.propertyPrice === "number" &&
    typeof o.monthlyRent === "number" &&
    typeof o.monthlyExpenses === "number" &&
    typeof o.roi === "number" &&
    typeof o.riskScore === "number" &&
    typeof o.rating === "string" &&
    typeof o.city === "string" &&
    typeof o.marketComparison === "string" &&
    typeof o.createdAt === "string"
  );
}

/** Read demo deals from localStorage (browser only). */
export function readDemoDealsFromStorage(): SerializableInvestmentDeal[] | null {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(DEMO_DEALS_STORAGE_KEY));
}

/** Persist full list (replaces). */
export function writeDemoDealsToStorage(deals: SerializableInvestmentDeal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_DEALS_STORAGE_KEY, JSON.stringify(deals));
}

/** First visit: seed with sample deals so compare/dashboard are never empty. */
export function ensureDemoDealsSeeded(): SerializableInvestmentDeal[] {
  if (typeof window === "undefined") return [];
  const existing = readDemoDealsFromStorage();
  if (existing && existing.length > 0) return existing;
  const samples = buildSampleDemoDeals();
  writeDemoDealsToStorage(samples);
  return samples;
}

/** Append a new deal (new analyses from /analyze in demo mode). */
export function appendDemoDeal(deal: SerializableInvestmentDeal): SerializableInvestmentDeal[] {
  const prev = readDemoDealsFromStorage() ?? ensureDemoDealsSeeded();
  const next = [deal, ...prev];
  writeDemoDealsToStorage(next);
  return next;
}
