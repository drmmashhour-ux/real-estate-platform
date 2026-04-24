import { prisma } from "@/lib/db";
import { getLatestBrokerDealScore } from "@/modules/deal/deal-scoring.service";

export type PrivateInvestorPacketContext = {
  deal: {
    id: string;
    priceCents: number;
    status: string;
    crmStage: string | null;
    dealScore: number | null;
    closeProbability: number | null;
    riskLevel: string | null;
    listingId: string | null;
    listingCode: string | null;
    executionMetadata: unknown;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    complianceScore: number | null;
    esgComposite: number | null;
  } | null;
  dealScoreSnapshot: {
    score: number;
    category: string | null;
    riskLevel: string | null;
    strengths: unknown;
    risks: unknown;
    recommendation: string | null;
  } | null;
  spv: {
    id: string;
    exemptionPath: string | null;
    privateExemptDealMode: boolean;
  } | null;
  investorUserId: string;
  disclaimers: {
    privatePlacementOnly: string;
    noGuaranteedReturns: string;
    notPublicOffering: string;
  };
};

const DISCLAIMERS = {
  privatePlacementOnly:
    "This materials package is for private placement discussions only. It is not an offer to sell or solicitation to buy securities to the public.",
  noGuaranteedReturns:
    "Past performance, illustrations, or scenarios are not guarantees of future results. Capital is at risk.",
  notPublicOffering:
    "This is not a prospectus and not filed with a securities regulator as a public offering document.",
};

/**
 * Aggregates CRM deal, listing, scoring, ESG, and SPV context for packet generation (advisory content).
 */
export async function buildPrivateInvestorPacketContext(
  dealId: string,
  investorUserId: string,
  spvId?: string | null,
): Promise<PrivateInvestorPacketContext> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      priceCents: true,
      status: true,
      crmStage: true,
      dealScore: true,
      closeProbability: true,
      riskLevel: true,
      listingId: true,
      listingCode: true,
      executionMetadata: true,
    },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");

  const listing =
    deal.listingId ?
      await prisma.listing.findUnique({
        where: { id: deal.listingId },
        select: {
          id: true,
          title: true,
          price: true,
          complianceScore: true,
          esgProfile: { select: { compositeScore: true } },
        },
      })
    : null;

  const latestScore = await getLatestBrokerDealScore(dealId);

  const spv =
    spvId ?
      await prisma.amfSpv.findUnique({
        where: { id: spvId },
        select: { id: true, exemptionPath: true, privateExemptDealMode: true },
      })
    : null;

  return {
    deal: {
      id: deal.id,
      priceCents: deal.priceCents,
      status: deal.status,
      crmStage: deal.crmStage,
      dealScore: deal.dealScore,
      closeProbability: deal.closeProbability,
      riskLevel: deal.riskLevel,
      listingId: deal.listingId,
      listingCode: deal.listingCode,
      executionMetadata: deal.executionMetadata,
    },
    listing: listing ?
      {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        complianceScore: listing.complianceScore,
        esgComposite: listing.esgProfile?.compositeScore ?? null,
      }
    : null,
    dealScoreSnapshot:
      latestScore ?
        {
          score: latestScore.score,
          category: latestScore.category,
          riskLevel: latestScore.riskLevel,
          strengths: latestScore.strengths,
          risks: latestScore.risks,
          recommendation: latestScore.recommendation,
        }
      : null,
    spv,
    investorUserId,
    disclaimers: DISCLAIMERS,
  };
}
