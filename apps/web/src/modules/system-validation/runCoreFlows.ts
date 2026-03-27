import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateOfferDraft } from "@/lib/document-drafting/generators/offer";
import { buildLegalGraphForDocument } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphBuilderService";
import { getCaseHealthSnapshot } from "@/src/modules/case-command-center/application/getCaseHealthSnapshot";
import { generateDeclarationReviewSummary } from "@/src/modules/seller-declaration-ai/application/generateDeclarationReviewSummary";
import {
  loadListingSimulationContext,
  runOfferScenarioSimulation,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import { saveOfferScenario } from "@/src/modules/offer-strategy-simulator/application/saveOfferScenario";
import { selectOfferScenario } from "@/src/modules/offer-strategy-simulator/application/selectOfferScenario";
import { checkUsageLimit } from "@/src/modules/closing/application/checkUsageLimit";
import {
  acceptVersion,
  createCounterOffer,
  createOffer,
} from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";
import {
  insertFunnelEvent,
  markReturnVisit,
} from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";
import type { GeneratedTestUser } from "@/src/modules/system-validation/generateTestUsers";
import type { TestFixtures } from "@/src/modules/system-validation/ensureTestFixtures";
import type {
  FlowId,
  FlowRunResult,
  ValidationError,
  PerformanceSample,
  ConversionMetrics,
} from "@/src/modules/system-validation/types";
import {
  assertStripeSandboxForBillingSimulation,
  isRealPaymentOrchestrationEnabled,
} from "@/src/modules/system-validation/assertSafeTestEnvironment";

const SLOW_MS = 2_500;

function perf(label: string, ms: number): PerformanceSample {
  return { label, durationMs: Math.round(ms * 100) / 100, slow: ms > SLOW_MS };
}

export async function runCoreFlows(args: {
  users: GeneratedTestUser[];
  fixtures: TestFixtures;
}): Promise<{
  flowResults: FlowRunResult[];
  errors: ValidationError[];
  performance: PerformanceSample[];
  conversion: ConversionMetrics;
}> {
  const { users, fixtures } = args;
  const errors: ValidationError[] = [];
  const performanceSamples: PerformanceSample[] = [];
  const flowResults: FlowRunResult[] = [];

  const freeBuyer = users.find((u) => u.plan === "free" && u.role === "BUYER");
  const proBuyer = users.find((u) => u.plan === "pro" && u.role === "BUYER");
  const broker = users.find((u) => u.role === "BROKER" && u.plan === "free");
  if (!freeBuyer || !proBuyer || !broker) {
    errors.push({
      type: "data",
      message: "Missing expected test users (free buyer, pro buyer, broker).",
    });
    return {
      flowResults: [],
      errors,
      performance: performanceSamples,
      conversion: emptyConversion(),
    };
  }

  const run = async (flowId: FlowId, fn: () => Promise<string | void>) => {
    const t0 = globalThis.performance.now();
    try {
      const detail = (await fn()) ?? undefined;
      const ms = globalThis.performance.now() - t0;
      performanceSamples.push(perf(flowId, ms));
      flowResults.push({ flowId, ok: true, durationMs: ms, detail });
    } catch (e) {
      const ms = globalThis.performance.now() - t0;
      performanceSamples.push(perf(`${flowId} (failed)`, ms));
      const message = e instanceof Error ? e.message : String(e);
      errors.push({
        type: "unknown",
        flowId,
        message,
        location: flowId,
        reproduction: ["Run runFullSystemTest() with TEST_MODE=true and logs enabled."],
      });
      flowResults.push({ flowId, ok: false, durationMs: ms, detail: message });
    }
  };

  await run("auth_landing_signup_dashboard", async () => {
    for (const u of users) {
      const row = await prisma.user.findUnique({ where: { id: u.id }, select: { passwordHash: true } });
      if (!row?.passwordHash) throw new Error(`No password hash for ${u.email}`);
      const ok = await verifyPassword(u.password, row.passwordHash);
      if (!ok) throw new Error(`Login verify failed for ${u.email}`);
    }
    return `${users.length} users sign-in verified`;
  });

  await run("property_search_simulator", async () => {
    const t0 = globalThis.performance.now();
    const ctx = await loadListingSimulationContext(fixtures.listingId);
    if (!ctx) throw new Error("loadListingSimulationContext returned null");
    const input = {
      propertyId: fixtures.listingId,
      offerPriceCents: Math.round(ctx.listPriceCents * 0.98),
      depositAmountCents: Math.round(ctx.listPriceCents * 0.05),
      financingCondition: true,
      inspectionCondition: true,
      documentReviewCondition: true,
      occupancyDate: null,
      signatureDate: null,
      userStrategyMode: "primary_residence",
    };
    const result = runOfferScenarioSimulation(input, ctx);
    if (result.nextActions.length === 0) throw new Error("Expected nextActions from simulator");
    if (result.dealImpact.score < 0) throw new Error("Invalid deal score");
    performanceSamples.push(perf("simulator_engine", globalThis.performance.now() - t0));

    await saveOfferScenario({
      userId: freeBuyer.id,
      propertyId: fixtures.listingId,
      caseId: null,
      scenarioLabel: "SV baseline",
      input,
      output: result,
    });
    return `simulator ok; dealScore=${result.dealImpact.score}`;
  });

  await run("watchlist_alerts", async () => {
    await prisma.buyerSavedListing.upsert({
      where: {
        userId_fsboListingId: { userId: freeBuyer.id, fsboListingId: fixtures.listingId },
      },
      create: { userId: freeBuyer.id, fsboListingId: fixtures.listingId },
      update: {},
    });
    const wl = await prisma.dealWatchlist.create({
      data: {
        ownerType: "user",
        ownerId: proBuyer.id,
        name: "[SV] watchlist",
      },
    });
    await prisma.dealWatchlistItem.create({
      data: {
        watchlistId: wl.id,
        propertyId: fixtures.listingId,
        lastInvestmentScore: 55,
        lastRiskScore: 40,
        lastOpportunityType: "value",
      },
    });
    await prisma.dealPortfolioAlert.create({
      data: {
        watchlistId: wl.id,
        propertyId: fixtures.listingId,
        alertType: "price_signal",
        severity: "info",
        title: "[SV] synthetic alert",
        message: "System validation triggered alert row.",
        metadata: { source: "system_validation" },
      },
    });
    return "watchlist + alert row created";
  });

  await run("ai_selection_next_action_scoring", async () => {
    const scenarios = await prisma.offerStrategyScenario.findMany({
      where: { userId: freeBuyer.id, propertyId: fixtures.listingId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    const s = scenarios[0];
    if (!s) throw new Error("No saved scenario to select");
    const sel = await selectOfferScenario({
      userId: freeBuyer.id,
      scenarioId: s.id,
      propertyId: fixtures.listingId,
      caseId: null,
    });
    if (!sel.ok) throw new Error(sel.error);
    return "selectOfferScenario ok";
  });

  await run("legal_declaration_draft", async () => {
    const summary = await generateDeclarationReviewSummary(fixtures.declarationDraftId);
    if (!summary) throw new Error("generateDeclarationReviewSummary null");
    const draft = await generateOfferDraft(fixtures.transactionId, broker.id);
    if (!draft.html.includes("offer")) throw new Error("Unexpected offer draft HTML");
    return `declaration summary ${summary.completionPercent}%`;
  });

  await run("negotiation_chain", async () => {
    await createOffer({
      propertyId: fixtures.listingId,
      caseId: fixtures.declarationDraftId,
      createdBy: freeBuyer.id,
      role: "buyer",
      terms: {
        priceCents: 430_000_00,
        depositCents: 20_000_00,
        financingTerms: {},
        commissionTerms: {},
        deadlines: {},
      },
      clauses: [],
    });
    const chain = await prisma.negotiationChain.findFirst({
      where: { propertyId: fixtures.listingId, caseId: fixtures.declarationDraftId },
    });
    if (!chain) throw new Error("negotiation chain missing");
    await createCounterOffer({
      chainId: chain.id,
      createdBy: fixtures.sellerUserId,
      role: "seller",
      terms: {
        priceCents: 440_000_00,
        depositCents: 25_000_00,
        financingTerms: {},
        commissionTerms: {},
        deadlines: {},
      },
      clauses: [],
    });
    const versions = await prisma.negotiationVersion.findMany({
      where: { chainId: chain.id },
      orderBy: { versionNumber: "desc" },
    });
    const latest = versions[0];
    if (!latest) throw new Error("no negotiation version");
    await acceptVersion(chain.id, latest.id);

    const po = await prisma.propertyOffer.create({
      data: {
        transactionId: fixtures.transactionId,
        buyerId: freeBuyer.id,
        offerPrice: 430_000_00,
        status: "pending",
        conditions: { inspection: true },
      },
    });
    await prisma.propertyCounterOffer.create({
      data: {
        offerId: po.id,
        counterPrice: 435_000_00,
        notes: "[SV] counter",
        createdById: fixtures.sellerUserId,
      },
    });
    await prisma.propertyOffer.update({
      where: { id: po.id },
      data: { status: "countered" },
    });
    return `chain ${chain.id} finalized v${latest.versionNumber}; property offer countered`;
  });

  await run("case_command_center", async () => {
    await buildLegalGraphForDocument(fixtures.declarationDraftId, broker.id);
    const snap = await getCaseHealthSnapshot(fixtures.declarationDraftId, broker.id);
    if (!snap) throw new Error("getCaseHealthSnapshot null");
    return `case health status=${snap.status} score=${snap.score}`;
  });

  await run("growth_content", async () => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString();
    await prisma.aiMarketingContent.create({
      data: {
        createdById: broker.id,
        contentType: "email_campaign",
        title: "[SV] scheduled draft",
        body: "Synthetic growth content for validation.",
        metadata: { scheduledAt, published: false, channel: "test" },
      },
    });
    await insertFunnelEvent({
      userId: freeBuyer.id,
      eventName: "scenario_saved",
      properties: { source: "system_validation" },
    });
    return "ai_marketing_content + funnel event";
  });

  let upgradeTriggerObserved = false;
  let conversionSimulated = false;

  await run("billing_upgrade_simulation", async () => {
    const stripe = assertStripeSandboxForBillingSimulation();
    if (stripe.notes.length) {
      /* notes surfaced in report environment */
    }
    if (isRealPaymentOrchestrationEnabled()) {
      throw new Error(
        "LECIPM_E2E_REAL_STRIPE_CHECKOUT is set — automated runner skips real Checkout; use Playwright + Stripe test cards separately.",
      );
    }
    const limit = await checkUsageLimit(freeBuyer.id, "simulator");
    const maxRuns = limit.limit;
    await prisma.growthUsageCounter.upsert({
      where: { userId: freeBuyer.id },
      create: { userId: freeBuyer.id, simulatorRuns: maxRuns },
      update: { simulatorRuns: maxRuns },
    });
    const atLimit = await checkUsageLimit(freeBuyer.id, "simulator");
    if (!atLimit.limitReached) throw new Error("Expected simulator limit reached for billing test");
    upgradeTriggerObserved = true;

    await prisma.user.update({
      where: { id: freeBuyer.id },
      data: { plan: "pro" },
    });
    const after = await checkUsageLimit(freeBuyer.id, "simulator");
    if (!after.allowed) throw new Error("Expected simulator allowed after pro upgrade");
    conversionSimulated = true;

    await prisma.user.update({
      where: { id: freeBuyer.id },
      data: { plan: "free" },
    });
    await prisma.growthUsageCounter.updateMany({
      where: { userId: freeBuyer.id },
      data: { simulatorRuns: 0 },
    });
    return "limit → pro unlock → restored free + zero runs";
  });

  await run("retention_referral", async () => {
    await markReturnVisit(proBuyer.id);
    const scenarios = await prisma.offerStrategyScenario.findMany({
      where: { userId: freeBuyer.id, propertyId: fixtures.listingId },
      take: 1,
    });
    if (!scenarios[0]) throw new Error("expected reopened scenario history");
    const code = `SV${randomUUID().replace(/-/g, "").slice(0, 10)}`;
    await prisma.user.update({
      where: { id: broker.id },
      data: { referralCode: code },
    });
    await prisma.referralEvent.create({
      data: { code, eventType: "click", userId: proBuyer.id },
    });
    return "return visit + scenario row + referral event";
  });

  await run("crm_lead", async () => {
    await prisma.lead.create({
      data: {
        name: "[SV] Lead",
        email: "sv-lead@test.lecipm.invalid",
        phone: "555-0100",
        message: "System validation CRM row",
        status: "new",
        score: 42,
        pipelineStatus: "new",
        fsboListingId: fixtures.listingId,
        userId: freeBuyer.id,
        leadSource: "system_validation",
      },
    });
    return "lead created";
  });

  const conversion = await buildConversionMetrics({
    users,
    freeBuyerId: freeBuyer.id,
    upgradeTriggerObserved,
    conversionSimulated,
  });

  return { flowResults, errors, performance: performanceSamples, conversion };
}

function emptyConversion(): ConversionMetrics {
  return {
    activationRate: 0,
    simulatorRunsObserved: 0,
    dropOffStage: null,
    upgradeTriggerObserved: false,
    conversionSimulated: false,
  };
}

async function buildConversionMetrics(args: {
  users: GeneratedTestUser[];
  freeBuyerId: string;
  upgradeTriggerObserved: boolean;
  conversionSimulated: boolean;
}): Promise<ConversionMetrics> {
  const activated = await prisma.growthUsageCounter.count({
    where: {
      userId: { in: args.users.map((u) => u.id) },
      activationCompletedAt: { not: null },
    },
  });
  const simRuns = await prisma.growthUsageCounter.aggregate({
    where: { userId: { in: args.users.map((u) => u.id) } },
    _sum: { simulatorRuns: true },
  });
  const funnel = await prisma.growthFunnelEvent.count({
    where: { userId: args.freeBuyerId, eventName: "scenario_saved" },
  });
  return {
    activationRate: args.users.length ? activated / args.users.length : 0,
    simulatorRunsObserved: simRuns._sum.simulatorRuns ?? 0,
    dropOffStage: funnel > 0 ? null : "pre_scenario_save",
    upgradeTriggerObserved: args.upgradeTriggerObserved,
    conversionSimulated: args.conversionSimulated,
  };
}
