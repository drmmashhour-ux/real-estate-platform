import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertPrivateInvestorPacketEligibility } from "@/modules/private-investor-packet/private-investor-packet-eligibility.service";
import {
  dealInvestmentTargetCents,
  dealRiskTierFromDeal,
  inferDealCityHints,
  parseInvestorSuitabilityProfile,
} from "./investor-suitability-profile";

export type DealInvestorMatchRow = {
  investorId: string;
  score: number;
  fitReasons: string[];
  /** Internal / QA — surfaced in API for tests & transparency */
  penalties: string[];
  complianceOk: boolean;
  complianceBlockers: string[];
};

export type DealMatchContext = {
  dealId: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  riskLevel: string | null;
  executionMetadata: unknown;
  listing: {
    id: string;
    title: string;
    listingType: string;
    esgComposite: number | null;
  } | null;
  retrofitScenarioCount: number;
};

async function loadDealMatchContext(dealId: string): Promise<DealMatchContext | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      priceCents: true,
      riskLevel: true,
      executionMetadata: true,
      listingId: true,
    },
  });
  if (!deal) return null;

  const listing =
    deal.listingId ?
      await prisma.listing.findUnique({
        where: { id: deal.listingId },
        select: {
          id: true,
          title: true,
          listingType: true,
          esgProfile: { select: { compositeScore: true } },
        },
      })
    : null;

  const retrofitScenarioCount =
    deal.listingId ?
      await prisma.esgRetrofitScenario.count({ where: { listingId: deal.listingId } })
    : 0;

  return {
    dealId: deal.id,
    buyerId: deal.buyerId,
    sellerId: deal.sellerId,
    priceCents: deal.priceCents,
    riskLevel: deal.riskLevel,
    executionMetadata: deal.executionMetadata,
    listing: listing ?
      {
        id: listing.id,
        title: listing.title,
        listingType: String(listing.listingType),
        esgComposite: listing.esgProfile?.compositeScore ?? null,
      }
    : null,
    retrofitScenarioCount,
  };
}

/** Deterministic fit score + narrative hooks (broker advisory only). */
export function scoreDealInvestorFit(
  ctx: DealMatchContext,
  suitabilityJson: unknown,
): { score: number; fitReasons: string[]; penalties: string[] } {
  const targetCents = dealInvestmentTargetCents(ctx.priceCents, ctx.executionMetadata);
  const parsed = parseInvestorSuitabilityProfile(suitabilityJson);
  const dealRisk = dealRiskTierFromDeal(ctx.riskLevel);
  const cityHints = inferDealCityHints(ctx.listing?.title ?? null, ctx.executionMetadata);

  let score = 52;
  const fitReasons: string[] = [];
  const penalties: string[] = [];

  const minT = parsed.minTicketCents;
  const maxT = parsed.maxTicketCents;
  const ticketLoose =
    (minT == null || minT <= targetCents * 1.15) && (maxT == null || maxT >= targetCents * 0.85);
  if (ticketLoose) {
    score += 14;
    fitReasons.push("Fits ticket size");
  } else {
    score -= 22;
    penalties.push("ticket_mismatch");
  }

  if (cityHints.length && parsed.preferredCities.length) {
    const invNorm = parsed.preferredCities.map((c) => c.toLowerCase());
    const hit = cityHints.some((h) => invNorm.some((c) => c.includes(h) || h.includes(c)));
    if (hit) {
      score += 12;
      const label = cityHints[0] ?? "target market";
      const pretty = label.charAt(0).toUpperCase() + label.slice(1);
      fitReasons.push(`Prefers ${pretty} residential value-add`);
    } else {
      score -= 12;
      penalties.push("geo_mismatch");
    }
  } else if (cityHints.length && !parsed.preferredCities.length) {
    score += 4;
    fitReasons.push("Geography neutral — no preferred markets on file");
  }

  if (parsed.riskTier != null) {
    if (parsed.riskTier >= dealRisk) {
      score += 10;
      if (parsed.riskTier >= 3 && dealRisk >= 2) {
        fitReasons.push("Accepts higher risk profile aligned with deal");
      } else if (dealRisk >= 2 || parsed.riskTier >= 2) {
        fitReasons.push("Accepts medium risk");
      } else {
        fitReasons.push("Risk tolerance accommodates this opportunity");
      }
    } else {
      score -= 18;
      penalties.push("risk_mismatch");
    }
  }

  const listingType = (ctx.listing?.listingType ?? "").toLowerCase();
  if (parsed.propertyTypes.length) {
    const hit = parsed.propertyTypes.some((p) => listingType.includes(p.toLowerCase()) || p.toLowerCase().includes(listingType));
    if (hit) {
      score += 6;
      fitReasons.push("Asset type aligns with investor mandate");
    } else if (listingType) {
      score -= 8;
      penalties.push("asset_mismatch");
    }
  }

  const esg = ctx.listing?.esgComposite;
  if (esg != null && esg >= 5.5 && parsed.esgFocus) {
    score += 12;
    if (ctx.retrofitScenarioCount > 0) {
      fitReasons.push("ESG-focused, strong match with retrofit scenario");
    } else {
      fitReasons.push("ESG-focused — listing shows elevated ESG composite");
    }
  } else if (parsed.esgFocus && (esg == null || esg < 5)) {
    score -= 6;
    penalties.push("esg_expectation_gap");
  }

  if (parsed.valueAddInterest && /MULTI|TRIPLEX|QUAD|PLEX|INCOME/i.test(ctx.listing?.title ?? "")) {
    score += 5;
    fitReasons.push("Value-add posture matches income-property profile");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (fitReasons.length === 0) {
    fitReasons.push("Baseline fit — review suitability intake for stronger personalization");
  }

  return { score, fitReasons, penalties };
}

/**
 * Ranks AMF-linked investors for a deal (advisory). Excludes transactional buyer/seller.
 * Compliance is evaluated per investor; matches may appear with blockers — sharing stays gated.
 */
export async function computeDealInvestorMatches(dealId: string, take = 30): Promise<DealInvestorMatchRow[]> {
  const ctx = await loadDealMatchContext(dealId);
  if (!ctx) return [];

  const investors = await prisma.amfInvestor.findMany({
    where: {
      userId: { not: null },
      user: { accountStatus: AccountStatus.ACTIVE },
      NOT: { userId: { in: [ctx.buyerId, ctx.sellerId] } },
    },
    select: {
      userId: true,
      suitabilityIntakeJson: true,
    },
    take: Math.min(take * 4, 120),
  });

  const rows: DealInvestorMatchRow[] = [];
  for (const inv of investors) {
    const investorId = inv.userId as string;
    const { score, fitReasons, penalties } = scoreDealInvestorFit(ctx, inv.suitabilityIntakeJson);
    const elig = await assertPrivateInvestorPacketEligibility({ dealId, investorUserId: investorId, spvId: null });
    rows.push({
      investorId,
      score,
      fitReasons,
      penalties,
      complianceOk: elig.ok,
      complianceBlockers: elig.ok ? [] : elig.blockers,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, take);
}
