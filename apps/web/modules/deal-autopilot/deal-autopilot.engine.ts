import { dealAutopilotDisclaimer } from "./deal-autopilot.explainer";
import type { DealAutopilotSnapshot } from "./deal-autopilot.types";
import { detectBlockers } from "./blocker-detector.service";
import { evaluateConditionDeadlines, evaluateRequestDeadlines } from "./deadline-autopilot.service";
import { buildNextBestActions } from "./next-step-engine.service";
import { evaluateDealHealth, evaluateCurrentStage } from "./state-evaluator.service";
import { computeClosingReadiness } from "./closing-readiness-autopilot.service";
import { buildBrokerActionQueue } from "./broker-action-queue.service";
import type { loadDealForAutopilot } from "./deal-autopilot.service";

type DealAutopilotRow = NonNullable<Awaited<ReturnType<typeof loadDealForAutopilot>>>;

export function runDealAutopilotEngine(deal: DealAutopilotRow): DealAutopilotSnapshot {
  const blockers = detectBlockers(deal);

  const overdueConditions = evaluateConditionDeadlines(deal.dealClosingConditions);
  const overdueRequests = evaluateRequestDeadlines(deal.dealRequests);
  const overdueItems = [...overdueConditions, ...overdueRequests];

  const openCompliance = deal.complianceCases.filter((c) => ["open", "under_review", "action_required"].includes(c.status)).length;

  const dealHealth = evaluateDealHealth({
    blockerCount: blockers.length,
    overdueCount: overdueItems.length,
    openComplianceCount: openCompliance,
  });

  const nextBestActions = buildNextBestActions({ blockers, overdueItems });
  const actionQueue = buildBrokerActionQueue(nextBestActions);

  const pendingConditions = deal.dealClosingConditions.filter((c) => c.status === "pending").length;
  const notaryOk =
    !deal.notaryCoordination ||
    (deal.notaryCoordination.packageStatus !== "blocked" && deal.notaryCoordination.packageStatus !== "incomplete");

  const closingReadiness = computeClosingReadiness({
    blockerCount: blockers.length,
    overdueCount: overdueItems.length,
    openCompliance,
    pendingConditions,
    notaryOk,
  });

  const confidence = Math.min(
    0.92,
    0.55 + (deal.documents.length > 0 ? 0.1 : 0) + (deal.dealRequests.length > 0 ? 0.08 : 0) + (deal.negotiationThreads.length > 0 ? 0.05 : 0),
  );

  return {
    dealId: deal.id,
    generatedAt: new Date().toISOString(),
    dealHealth,
    currentStage: evaluateCurrentStage(deal),
    confidence,
    blockers,
    overdueItems,
    nextBestActions: actionQueue,
    closingReadiness,
    disclaimer: dealAutopilotDisclaimer(),
  };
}
