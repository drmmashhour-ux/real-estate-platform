/**
 * Deterministic tool names — Copilot maps intents to these; implementations call real services (TrustGraph, Deal Analyzer, etc.).
 * OpenAI must never replace these calls or override their numeric/legal outputs.
 */
export const COPILOT_TOOLS = {
  getListing: "getListing",
  getTrustScore: "getTrustScore",
  getDealScore: "getDealScore",
  getFraudScore: "getFraudScore",
  getLeadInsights: "getLeadInsights",
  searchListings: "searchListings",
  runTrustCheck: "runTrustCheck",
  runDealAnalysis: "runDealAnalysis",
  getPricingAdvice: "getPricingAdvice",
  getPortfolioSummary: "getPortfolioSummary",
  getSeoDraftContext: "getSeoDraftContext",
  getMortgageReadiness: "getMortgageReadiness",
  createNextBestActionDraft: "createNextBestActionDraft",
} as const;

export type CopilotToolName = (typeof COPILOT_TOOLS)[keyof typeof COPILOT_TOOLS];

import { prisma } from "@/lib/db";
import { getLeadIntelligence } from "@/modules/ai-core/application/leadIntelligenceService";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";

export async function callCopilotTool(
  tool: CopilotToolName,
  input: { listingId?: string; leadId?: string; city?: string; workspaceId?: string; userId?: string }
) {
  switch (tool) {
    case COPILOT_TOOLS.getListing: {
      if (!input.listingId) return null;
      return prisma.fsboListing.findUnique({
        where: { id: input.listingId },
        select: { id: true, title: true, address: true, city: true, trustScore: true, priceCents: true, propertyType: true },
      });
    }
    case COPILOT_TOOLS.getTrustScore: {
      if (!input.listingId) return null;
      const l = await prisma.fsboListing.findUnique({
        where: { id: input.listingId },
        select: { trustScore: true },
      });
      return { trustScore: l?.trustScore ?? null };
    }
    case COPILOT_TOOLS.getDealScore: {
      if (!input.listingId) return null;
      const lead = await prisma.lead.findFirst({
        where: { fsboListingId: input.listingId },
        orderBy: { createdAt: "desc" },
        select: { lecipmDealQualityScore: true },
      });
      return { dealScore: lead?.lecipmDealQualityScore ?? null };
    }
    case COPILOT_TOOLS.getFraudScore: {
      if (!input.listingId) return null;
      const listing = await prisma.fsboListing.findUnique({
        where: { id: input.listingId },
        select: { trustScore: true, moderationStatus: true },
      });
      const trust = listing?.trustScore ?? 50;
      const fraudScore = Math.max(0, Math.min(100, 100 - trust + (listing?.moderationStatus === "APPROVED" ? 0 : 10)));
      return { fraudScore };
    }
    case COPILOT_TOOLS.getLeadInsights: {
      if (!input.leadId) return null;
      return getLeadIntelligence(prisma, input.leadId);
    }
    case COPILOT_TOOLS.getPricingAdvice: {
      if (!input.listingId) return null;
      return getSellerPricingAdvisorDto(input.listingId);
    }
    case COPILOT_TOOLS.getPortfolioSummary: {
      if (!input.userId) return null;
      const [watchlists, scenarios] = await Promise.all([
        prisma.dealWatchlist.count({ where: { ownerId: input.userId } }),
        prisma.portfolioScenario.count({ where: { userId: input.userId } }),
      ]);
      return { watchlists, scenarios };
    }
    case COPILOT_TOOLS.getSeoDraftContext: {
      const city = input.city ?? null;
      if (!city) return null;
      const posts = await prisma.seoBlogPost.findMany({
        where: { city: { equals: city, mode: "insensitive" } },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { title: true, keywords: true, slug: true },
      });
      return { city, recentSeoPosts: posts };
    }
    default:
      return null;
  }
}
