import { CopilotIntent, CopilotMessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getDealAnalysisPublicDto, getLatestDealAnalysisRecord } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { runDealAnalysis } from "@/modules/deal-analyzer/application/runDealAnalysis";
import { runSellerPricingAdvisor } from "@/modules/deal-analyzer/application/runSellerPricingAdvisor";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";
import { isDealAnalyzerEnabled, isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";
import { COPILOT_MASTER_DISCLAIMER } from "@/modules/copilot/domain/copilotDisclaimers";
import type { CopilotActionItem, CopilotResponse, CopilotResult } from "@/modules/copilot/domain/copilotTypes";
import {
  isCopilotBrokerEnabled,
  isCopilotEnabled,
  isCopilotInvestorEnabled,
  isCopilotPortfolioEnabled,
  isCopilotSellerEnabled,
} from "@/modules/copilot/config";
import { mapIntentToAction } from "@/modules/copilot/application/mapIntentToAction";
import { detectIntentWithOptionalLlm } from "@/modules/copilot/infrastructure/intentDetectionService";
import { extractUuidFromText } from "@/modules/copilot/infrastructure/extractContext";
import { extractCityHint, extractMaxPriceCents } from "@/modules/copilot/infrastructure/parseCopilotMessage";
import { runInvestorDealSearch } from "@/modules/copilot/infrastructure/investorCopilotService";
import { runSellerWhyNotSelling } from "@/modules/copilot/infrastructure/sellerCopilotService";
import { runBrokerListingsFix } from "@/modules/copilot/infrastructure/brokerCopilotService";
import { runPortfolioWhatChanged } from "@/modules/copilot/infrastructure/portfolioCopilotService";
import { runRiskCheck } from "@/modules/copilot/infrastructure/riskCheckService";
import { runImproveListingForOwner } from "@/modules/copilot/infrastructure/improveListingService";

export type RunCopilotInput = {
  query: string;
  userId: string | null;
  userRole: string;
  listingId?: string | null;
  watchlistId?: string | null;
  conversationId?: string | null;
  workspaceId?: string | null;
};

function baseWarnings(): string[] {
  return [COPILOT_MASTER_DISCLAIMER];
}

function actionsForListing(id: string): CopilotActionItem[] {
  return [
    {
      id: "open-listing",
      label: "Open listing",
      href: `/sell/${id}`,
      kind: "navigate",
    },
  ];
}

function mapUserIntentToPrismaIntent(intent: CopilotUserIntent): CopilotIntent {
  return intent as CopilotIntent;
}

async function ensureCopilotConversation(
  query: string,
  input: RunCopilotInput
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string; code: "not_found" }> {
  const userId = input.userId as string;

  if (input.conversationId) {
    const conv = await prisma.copilotConversation.findUnique({
      where: { id: input.conversationId },
    });
    if (!conv || conv.userId !== userId) {
      return { ok: false, error: "Conversation not found", code: "not_found" };
    }
    return { ok: true, conversationId: conv.id };
  }

  const created = await prisma.copilotConversation.create({
    data: {
      userId,
      workspaceId: input.workspaceId ?? null,
      title: query.slice(0, 80),
    },
  });
  return { ok: true, conversationId: created.id };
}

async function assertListingReadableForAnalysis(listingId: string, userId: string | null): Promise<boolean> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, status: true, moderationStatus: true },
  });
  if (!listing) return false;
  if (isFsboPubliclyVisible(listing)) return true;
  if (userId && listing.ownerId === userId) return true;
  if (userId && (await isPlatformAdmin(userId))) return true;
  return false;
}

export async function runCopilot(input: RunCopilotInput): Promise<CopilotResult> {
  if (!isCopilotEnabled()) {
    return { ok: false, error: "Copilot is disabled", code: "disabled" };
  }

  const query = input.query.trim();
  if (!query) {
    return { ok: false, error: "Query is required", code: "bad_request" };
  }

  let conversationId: string | undefined;

  if (input.userId) {
    const conv = await ensureCopilotConversation(query, input);
    if (!conv.ok) {
      return { ok: false, error: conv.error, code: conv.code };
    }
    conversationId = conv.conversationId;

    await prisma.copilotMessage.create({
      data: {
        conversationId,
        role: CopilotMessageRole.user,
        content: query,
      },
    });
  }

  const result = await runCopilotCore({ ...input, query });

  if (input.userId && conversationId && result.ok) {
    await prisma.copilotMessage.create({
      data: {
        conversationId,
        role: CopilotMessageRole.assistant,
        content: result.response.summary,
        intent: mapUserIntentToPrismaIntent(result.response.intent),
        metadata: result.response as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.copilotConversation.update({
      where: { id: conversationId },
      data: { lastIntent: mapUserIntentToPrismaIntent(result.response.intent) },
    });
    return { ...result, conversationId };
  }

  return result;
}

async function runCopilotCore(input: RunCopilotInput): Promise<CopilotResult> {
  const query = input.query.trim();
  if (!query) {
    return { ok: false, error: "Query is required", code: "bad_request" };
  }

  const detected = await detectIntentWithOptionalLlm(query);
  let intent = detected.intent;

  const resolvedListingId = input.listingId?.trim() || extractUuidFromText(query) || null;

  /** Contextual override: explicit listing + short query → analyze */
  if (resolvedListingId && query.length < 80 && !/\b(?:not selling|pricing|portfolio|risk|improve|deal)\b/i.test(query)) {
    intent = CopilotUserIntent.ANALYZE_PROPERTY;
  }

  const plan = mapIntentToAction(intent);

  try {
    switch (intent) {
      case CopilotUserIntent.FIND_DEALS: {
        if (!isCopilotInvestorEnabled()) {
          return { ok: false, error: "Investor Copilot is disabled", code: "disabled" };
        }
        const cityRaw = extractCityHint(query);
        const maxPriceCents = extractMaxPriceCents(query);
        const out = await runInvestorDealSearch({ cityRaw, maxPriceCents });
        if (!out.ok) {
          return { ok: false, error: out.error, code: "bad_request" };
        }
        const block = out.block;
        const actions: CopilotActionItem[] =
          block.type === "ranked_deals"
            ? block.items.slice(0, 10).flatMap((it) => [
                {
                  id: `open-${it.listingId}`,
                  label: `${it.title.slice(0, 42)}${it.title.length > 42 ? "…" : ""}`,
                  href: `/sell/${it.listingId}`,
                  kind: "navigate" as const,
                },
              ])
            : [];
        const response: CopilotResponse = {
          intent,
          summary: out.summaryLine,
          actions,
          insights: block.type === "ranked_deals" ? block.items.slice(0, 6).flatMap((i) => i.reasons.slice(0, 2)) : [],
          warnings: baseWarnings(),
          confidence: detected.confidence,
          data: { plan, block, query: { cityRaw, maxPriceCents } },
        };
        return { ok: true, response };
      }

      case CopilotUserIntent.ANALYZE_PROPERTY: {
        if (!isDealAnalyzerEnabled()) {
          return { ok: false, error: "Deal Analyzer is disabled", code: "disabled" };
        }
        const lid = resolvedListingId;
        if (!lid) {
          return {
            ok: false,
            error: "Paste a listing URL or UUID, or open Copilot from a listing page.",
            code: "bad_request",
          };
        }
        const canRead = await assertListingReadableForAnalysis(lid, input.userId);
        if (!canRead) {
          return { ok: false, error: "Listing not found or not visible for your account", code: "not_found" };
        }
        const existing = await getLatestDealAnalysisRecord(lid);
        if (!existing) {
          const run = await runDealAnalysis({ listingId: lid, analysisType: "listing" });
          if (!run.ok) {
            return { ok: false, error: run.error, code: "bad_request" };
          }
        }
        const dto = await getDealAnalysisPublicDto(lid);
        if (!dto) {
          return { ok: false, error: "Could not load analysis", code: "bad_request" };
        }
        const response: CopilotResponse = {
          intent,
          summary: `Deterministic Deal Analyzer snapshot for this listing — ${dto.recommendation.replace(/_/g, " ")}.`,
          actions: actionsForListing(lid),
          insights: [...dto.reasons.slice(0, 6), `Confidence: ${dto.confidenceLevel}`],
          warnings: [...baseWarnings(), ...dto.warnings.slice(0, 4)],
          confidence: "high",
          data: {
            plan,
            dealAnalysis: dto,
            listingId: lid,
          },
        };
        return { ok: true, response };
      }

      case CopilotUserIntent.WHY_NOT_SELLING: {
        if (!isCopilotSellerEnabled() || !isDealAnalyzerEnabled()) {
          return { ok: false, error: "Seller Copilot or Deal Analyzer is disabled", code: "disabled" };
        }
        if (!input.userId || !resolvedListingId) {
          return {
            ok: false,
            error: "Sign in and select a listing (or paste a listing id you own).",
            code: "bad_request",
          };
        }
        const out = await runSellerWhyNotSelling({ listingId: resolvedListingId, ownerId: input.userId });
        if (!out.ok) {
          return { ok: false, error: out.error, code: out.error === "Listing not found" ? "not_found" : "bad_request" };
        }
        const block = out.block;
        const insights =
          block.type === "seller_insights" ? [...block.insights.reasons, ...block.insights.suggestedActions.slice(0, 4)] : [];
        const response: CopilotResponse = {
          intent,
          summary: out.summaryLine,
          actions: actionsForListing(resolvedListingId),
          insights,
          warnings: baseWarnings(),
          confidence: "medium",
          data: { plan, block },
        };
        return { ok: true, response };
      }

      case CopilotUserIntent.IMPROVE_LISTING: {
        if (!input.userId) {
          return { ok: false, error: "Sign in to improve a listing", code: "unauthorized" };
        }
        if (resolvedListingId) {
          const imp = await runImproveListingForOwner({ listingId: resolvedListingId, ownerId: input.userId });
          if (!imp.ok) {
            return { ok: false, error: imp.error, code: "not_found" };
          }
          const response: CopilotResponse = {
            intent,
            summary: "Checklist based on trust, media, and TrustGraph signals (if enabled).",
            actions: actionsForListing(resolvedListingId),
            insights: imp.issues,
            warnings: baseWarnings(),
            confidence: "medium",
            data: { plan, listingId: resolvedListingId, issues: imp.issues },
          };
          return { ok: true, response };
        }
        if (isCopilotBrokerEnabled() && (input.userRole === "ADMIN" || input.userRole === "BROKER")) {
          const b = await runBrokerListingsFix();
          const items = b.block.type === "broker_attention" ? b.block.items.slice(0, 10) : [];
          const response: CopilotResponse = {
            intent,
            summary: b.summaryLine,
            actions: items.map((it) => ({
              id: it.listingId,
              label: it.title.length > 40 ? `${it.title.slice(0, 40)}…` : it.title,
              href: `/dashboard/seller/listings/${it.listingId}`,
              kind: "navigate" as const,
            })),
            insights: items.flatMap((i) => i.issues.slice(0, 2)),
            warnings: baseWarnings(),
            confidence: "medium",
            data: { plan, block: b.block },
          };
          return { ok: true, response };
        }
        return {
          ok: false,
          error: "Paste a listing id you own, or use a broker/admin account to see platform-wide gaps.",
          code: "bad_request",
        };
      }

      case CopilotUserIntent.PORTFOLIO_SUMMARY: {
        if (!isCopilotPortfolioEnabled()) {
          return { ok: false, error: "Portfolio Copilot is disabled", code: "disabled" };
        }
        if (!input.userId) {
          return { ok: false, error: "Sign in to view portfolio summary", code: "unauthorized" };
        }
        const out = await runPortfolioWhatChanged({
          userId: input.userId,
          watchlistId: input.watchlistId?.trim() ?? null,
        });
        if (!out.ok) {
          return { ok: false, error: out.error, code: "bad_request" };
        }
        const block = out.block;
        const events = block.type === "portfolio_week" ? block.events : [];
        const response: CopilotResponse = {
          intent,
          summary: out.summaryLine,
          actions: [
            {
              id: "investor-dash",
              label: "Open investor dashboard",
              href: "/dashboard/investor",
              kind: "navigate",
            },
          ],
          insights: events.slice(0, 6).map((e) => `${e.title}: ${e.message}`),
          warnings: baseWarnings(),
          confidence: "medium",
          data: { plan, block },
        };
        return { ok: true, response };
      }

      case CopilotUserIntent.RISK_CHECK: {
        if (!resolvedListingId) {
          return { ok: false, error: "Paste a listing UUID or open Copilot from a listing.", code: "bad_request" };
        }
        const canRead = await assertListingReadableForAnalysis(resolvedListingId, input.userId);
        if (!canRead) {
          return { ok: false, error: "Listing not found or not visible for your account", code: "not_found" };
        }
        const r = await runRiskCheck({ listingId: resolvedListingId });
        if (!r.ok) {
          return { ok: false, error: r.error, code: "not_found" };
        }
        const response: CopilotResponse = {
          intent,
          summary: `Rules-based risk/trust snapshot for ${r.listing.title}.`,
          actions: actionsForListing(resolvedListingId),
          insights: r.insights,
          warnings: [...baseWarnings(), ...r.warnings],
          confidence: "medium",
          data: { plan, listing: r.listing },
        };
        return { ok: true, response };
      }

      case CopilotUserIntent.PRICING_HELP: {
        if (!isDealAnalyzerPricingAdvisorEnabled()) {
          return { ok: false, error: "Seller pricing advisor is disabled", code: "disabled" };
        }
        if (!input.userId || !resolvedListingId) {
          return {
            ok: false,
            error: "Sign in and provide a listing you manage (or paste its id).",
            code: "bad_request",
          };
        }
        const listing = await prisma.fsboListing.findFirst({
          where: { id: resolvedListingId, ownerId: input.userId },
          select: { id: true },
        });
        if (!listing) {
          return { ok: false, error: "Listing not found", code: "not_found" };
        }
        const run = await runSellerPricingAdvisor({ listingId: resolvedListingId });
        if (!run.ok) {
          return { ok: false, error: run.error, code: "bad_request" };
        }
        const dto = await getSellerPricingAdvisorDto(resolvedListingId);
        const response: CopilotResponse = {
          intent,
          summary: "Seller pricing advisor snapshot (rules-based — not an appraisal).",
          actions: actionsForListing(resolvedListingId),
          insights: dto ? [...dto.reasons, ...dto.improvementActions.slice(0, 6)] : [],
          warnings: baseWarnings(),
          confidence: "medium",
          data: { plan, pricingAdvisor: dto },
        };
        return { ok: true, response };
      }

      default: {
        const response: CopilotResponse = {
          intent: CopilotUserIntent.UNKNOWN,
          summary:
            "Try: “Find deals under $600k in Laval”, “Analyze [listing uuid]”, “Portfolio summary”, or “Why is my listing not selling?” with a listing selected.",
          actions: [
            { id: "q-deals", label: "Find deals (example)", kind: "info" },
            { id: "q-portfolio", label: "Portfolio summary (example)", kind: "info" },
          ],
          insights: [],
          warnings: baseWarnings(),
          confidence: "low",
          data: { plan: mapIntentToAction(CopilotUserIntent.UNKNOWN), detected },
        };
        return { ok: true, response };
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Copilot run failed",
      code: "bad_request",
    };
  }
}
