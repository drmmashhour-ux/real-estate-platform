import type { Deal } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeDealCapitalAllocation } from "./capital-allocator.engine";
import type { ExpectedReturnBand } from "./capital-allocator.types";

export const DEAL_CAPITAL_ALLOCATION_ADVISORY =
  "Advisory recommendation only. A licensed broker must review and approve before any capital commitment.";

const TERMINAL = new Set(["closed", "cancelled"]);

function normalizeProbability(raw: number | null | undefined): number {
  if (raw == null || Number.isNaN(raw)) return 0.5;
  let p = raw;
  if (p > 1) p = p / 100;
  return Math.min(1, Math.max(0, p));
}

function normalizeDealScore(raw: number | null | undefined): number {
  if (raw == null || Number.isNaN(raw)) return 0.5;
  let s = raw;
  if (s > 1) s = s / 100;
  return Math.min(1, Math.max(0, s));
}

function normalizeEsg(composite: number | null | undefined): number {
  if (composite == null || Number.isNaN(composite)) return 0.55;
  let e = composite;
  if (e > 1) e = e / 100;
  return Math.min(1, Math.max(0, e));
}

function parseRiskLevel(raw: string | null | undefined): "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" {
  const u = (raw ?? "").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH") return u;
  return "UNKNOWN";
}

function riskScoreFromLevel(level: ReturnType<typeof parseRiskLevel>, explicit?: number | null): number {
  if (explicit != null && !Number.isNaN(explicit)) {
    let r = explicit;
    if (r > 1) r = r / 100;
    return Math.min(1, Math.max(0, r));
  }
  if (level === "HIGH") return 0.82;
  if (level === "MEDIUM") return 0.5;
  if (level === "LOW") return 0.22;
  return 0.5;
}

const DEFAULT_POOL_FRACTION_OF_PRICE = 0.22;
const MIN_DEFAULT_POOL_CENTS = 500_000; // $5,000 minimum default pool for math stability

export type BuildAllocatorContextParams = {
  deal: Deal;
  totalDeployableCapitalCents?: number | null;
  expectedReturnBand?: ExpectedReturnBand | null;
};

/**
 * Loads listing ESG (if linked), broker active deal count, and builds engine inputs.
 */
export async function buildDealCapitalAllocatorInput(params: BuildAllocatorContextParams) {
  const { deal } = params;
  const brokerId = deal.brokerId;
  const activeSiblingCount =
    brokerId ?
      await prisma.deal.count({
        where: {
          brokerId,
          NOT: { status: { in: [...TERMINAL] } },
        },
      })
    : 1;

  const targetMinDeals = 4;
  const diversificationScore = Math.min(1, activeSiblingCount / targetMinDeals);

  let esgComposite: number | null = null;
  if (deal.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: deal.listingId },
      select: { esgProfile: { select: { compositeScore: true } } },
    });
    esgComposite = listing?.esgProfile?.compositeScore ?? null;
  }

  const riskLevel = parseRiskLevel(deal.riskLevel);
  const riskScore = riskScoreFromLevel(riskLevel);

  let totalCents =
    params.totalDeployableCapitalCents != null ?
      Math.floor(params.totalDeployableCapitalCents)
    : Math.round(deal.priceCents * DEFAULT_POOL_FRACTION_OF_PRICE);
  if (!Number.isFinite(totalCents) || totalCents < MIN_DEFAULT_POOL_CENTS) {
    totalCents = Math.max(MIN_DEFAULT_POOL_CENTS, Math.round(deal.priceCents * DEFAULT_POOL_FRACTION_OF_PRICE));
  }

  const expectedReturnBand: ExpectedReturnBand = params.expectedReturnBand ?? "MEDIUM";

  return {
    engineInput: {
      dealScore: normalizeDealScore(deal.dealScore),
      riskScore,
      closeProbability: normalizeProbability(deal.closeProbability),
      esgScore: normalizeEsg(esgComposite),
      expectedReturnBand,
      diversificationScore,
      riskLevel,
      totalDeployableCapitalCents: totalCents,
    },
    meta: {
      activeSiblingCount,
      esgComposite,
    },
  };
}

function confidenceFromDeal(deal: Deal, engineConfidence: number, esgPresent: boolean): number {
  let c = engineConfidence;
  if (deal.dealScore == null || Number.isNaN(deal.dealScore)) c -= 12;
  if (deal.closeProbability == null || Number.isNaN(deal.closeProbability)) c -= 10;
  if (!deal.riskLevel) c -= 8;
  if (!esgPresent) c -= 5;
  return Math.min(96, Math.max(38, c));
}

export async function proposeDealCapitalAllocation(params: BuildAllocatorContextParams) {
  const { engineInput, meta } = await buildDealCapitalAllocatorInput(params);
  const result = computeDealCapitalAllocation(engineInput);
  const esgPresent = meta.esgComposite != null && !Number.isNaN(meta.esgComposite);
  const confidenceScore = confidenceFromDeal(params.deal, result.confidenceScore, esgPresent);
  return { ...result, confidenceScore, engineInput, meta };
}

export function formatCapitalAllocationHeadline(amountCents: number, allocationPercent: number): string {
  const dollars = amountCents / 100;
  const pct = allocationPercent * 100;
  const money = dollars.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
  return `AI recommends investing ${money} (${pct.toFixed(1)}%)`;
}
