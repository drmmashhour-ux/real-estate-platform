import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type {
  ClientTypeCoarse,
  DealPortfolioSlice,
  FinancingBand,
  LeadPortfolioSlice,
  PriceBand,
  PropertyTypeCoarse,
  UrgencyCoarse,
} from "./brokerage-intelligence.types";

const MAX_LEN = 256;

function priceBand(cents: number | null | undefined): PriceBand {
  if (typeof cents !== "number" || !Number.isFinite(cents) || cents <= 0) return "unknown";
  const d = cents / 100;
  if (d < 300_000) return "p_lt300k";
  if (d < 600_000) return "p_300_600";
  if (d < 1_000_000) return "p_600_1m";
  if (d < 2_000_000) return "p_1_2m";
  return "p_gt2m";
}

function fromLeadType(t?: string | null): ClientTypeCoarse {
  if (!t) return "unknown";
  const s = t.toLowerCase();
  if (s.includes("mortgage") || s.includes("finance")) return "mortgage";
  if (s.includes("rent")) return "other";
  if (s.includes("buy")) return "buyer";
  if (s.includes("sell")) return "seller";
  if (s.includes("invest")) return "investor";
  return "other";
}

function financingBand(label?: string | null): FinancingBand {
  if (!label) return "unknown";
  const s = label.toLowerCase();
  if (s.includes("strong") || s.includes("approved") || s.includes("pre")) return "strong";
  if (s.includes("weak") || s.includes("no")) return "weak";
  if (s.includes("med") || s.includes("soft")) return "medium";
  return "medium";
}

function urgency(s?: string | null, engagement?: number | null): UrgencyCoarse {
  if (typeof s === "string" && s.length) {
    const t = s.toLowerCase();
    if (t.includes("high") || t.includes("hot") || t.includes("urgent")) return "high";
    if (t.includes("low")) return "low";
    if (t.includes("med")) return "med";
  }
  if (typeof engagement === "number" && engagement > 60) return "med";
  return "low";
}

/**
 * Deterministic string from lead or marketing fields — for routing audit / segment join.
 */
export function buildPortfolioContextBucket(
  leadOrDeal: (LeadPortfolioSlice & { kind?: "lead" }) | (DealPortfolioSlice & { kind?: "deal" })
): string {
  if ("status" in leadOrDeal && "priceCents" in leadOrDeal) {
    return buildFromDeal(leadOrDeal);
  }
  return buildFromLead(leadOrDeal);
}

function locPart(x: { location?: string | null; propertyRegion?: string | null } | LeadPortfolioSlice): string {
  const l = (x as LeadPortfolioSlice).location;
  if (l && typeof l === "string") return l.toLowerCase().replace(/\|/g, "_").replace(/\s+/g, "_").slice(0, 24);
  const p = (x as DealPortfolioSlice).propertyRegion;
  if (p && typeof p === "string") return p.toLowerCase().replace(/\|/g, "_").replace(/\s+/g, "_").slice(0, 24);
  return "loc_unknown";
}

function buildFromLead(lead: LeadPortfolioSlice & { kind?: "lead" }): string {
  const dollars = typeof lead.estimatedValue === "number" && lead.estimatedValue > 0 ? lead.estimatedValue : (lead.dealValue ?? 0);
  const priceHint = dollars > 0 ? Math.round(dollars * 100) : 0;
  const pb = priceHint > 0 ? priceBand(priceHint) : "unknown";
  const pt: PropertyTypeCoarse = lead.propertyType
    ? String(lead.propertyType).toLowerCase().includes("mortg")
      ? "mortgage"
      : "residential"
    : lead.mortgageInquiry
      ? "mortgage"
      : "unknown";
  const client = fromLeadType(lead.leadType);
  const fin = financingBand(lead.financingLabel);
  const urg = urgency(lead.urgencyLabel, lead.engagementScore);
  const parts = [
    "lead",
    `loc_${locPart(lead)}`,
    pb,
    `prop_${pt}`,
    `cl_${client}`,
    `fin_${fin}`,
    `ur_${urg}`,
  ];
  const out = parts.join("|").slice(0, MAX_LEN);
  portfolioIntelLog.contextBucket({ kind: "lead", len: out.length });
  return out;
}

function buildFromDeal(deal: DealPortfolioSlice & { kind?: "deal" }): string {
  const pb = priceBand(deal.priceCents);
  const stage = (deal.crmStage ?? "unknown").toLowerCase().replace(/\|/g, "_").slice(0, 20);
  const st = (deal.status ?? "unknown").toLowerCase().slice(0, 20);
  const part = [locPart(deal), pb, `st_${st}`, `crm_${stage}`, "deal"];
  const b = part.join("|").slice(0, MAX_LEN);
  portfolioIntelLog.contextBucket({ kind: "deal", len: b.length });
  return b;
}

export function buildPortfolioContextBucketForLead(lead: LeadPortfolioSlice): string {
  return buildFromLead(lead);
}

export function buildPortfolioContextBucketForDeal(deal: DealPortfolioSlice): string {
  return buildFromDeal(deal);
}
