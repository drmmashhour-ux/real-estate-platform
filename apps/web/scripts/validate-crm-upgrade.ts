/**
 * Validates CRM execution engine (pure scoring + optional DB smoke test).
 * Run: pnpm --filter @lecipm/web exec tsx scripts/validate-crm-upgrade.ts
 */
import {
  computeFrictionScore,
  computeIntentScore,
  computePriorityScore,
  computeTrustScore,
  computeUrgencyScore,
} from "../src/modules/crm/aiScoringEngine";
import { deriveExecutionStage } from "../src/modules/crm/executionStageSync";
import { resolveNextBestAction } from "../src/modules/crm/nextBestAction";
import type { LeadScoringContext } from "../src/modules/crm/crmExecutionTypes";

function baseCtx(over: Partial<LeadScoringContext>): LeadScoringContext {
  const now = new Date();
  return {
    listingViews: 0,
    ctaClicks: 0,
    bookingStarted: false,
    bookingConfirmed: false,
    platformMessageCount: 0,
    crmChatUserTurns: 0,
    lastEventAt: now,
    leadCreatedAt: now,
    leadUpdatedAt: now,
    hasIntroducedBroker: false,
    hasAssignedExpert: false,
    accountActive: false,
    highIntentFlag: false,
    messageLength: 0,
    ...over,
  };
}

function main(): void {
  const hotBrowse = baseCtx({ listingViews: 4, ctaClicks: 1, messageLength: 120 });
  const intent = computeIntentScore(hotBrowse);
  const urgency = computeUrgencyScore(hotBrowse);
  const trust = computeTrustScore(hotBrowse);
  const friction = computeFrictionScore(hotBrowse);
  const priority = computePriorityScore({ intent, urgency, trust, friction });
  const stage = deriveExecutionStage({
    ctx: hotBrowse,
    pipelineStatus: "new",
    pipelineStage: "new",
    lostAt: null,
    wonAt: null,
    dealClosedAt: null,
  });
  const next = resolveNextBestAction({
    ctx: hotBrowse,
    intent,
    urgency,
    friction,
    executionStage: stage,
    hoursSinceActivity: 0.5,
  });

  console.log("Simulated user A (browse + inquiry):", { intent, urgency, trust, friction, priority, stage, next });

  const bookingDrop = baseCtx({
    bookingStarted: true,
    bookingConfirmed: false,
    listingViews: 3,
    lastEventAt: new Date(),
  });
  const next2 = resolveNextBestAction({
    ctx: bookingDrop,
    intent: computeIntentScore(bookingDrop),
    urgency: computeUrgencyScore(bookingDrop),
    friction: computeFrictionScore(bookingDrop),
    executionStage: "booking_started",
    hoursSinceActivity: 2,
  });
  console.log("Simulated user B (booking started):", { nextBest: next2 });

  const queueSort = [
    { id: "a", priorityScore: 80, lastActivityAt: new Date(Date.now() - 3600_000) },
    { id: "b", priorityScore: 90, lastActivityAt: new Date(Date.now() - 7200_000) },
  ].sort((x, y) => {
    if (y.priorityScore !== x.priorityScore) return y.priorityScore - x.priorityScore;
    const ta = x.lastActivityAt?.getTime() ?? 0;
    const tb = y.lastActivityAt?.getTime() ?? 0;
    return tb - ta;
  });
  console.log("Priority queue order sample:", queueSort.map((r) => r.id).join(" → "));

  if (next2 !== "push_booking") {
    console.error("Expected push_booking for abandoned checkout path", next2);
    process.exit(1);
  }

  console.log("\nLECIPM CRM EXECUTION ENGINE ACTIVE");
}

main();
