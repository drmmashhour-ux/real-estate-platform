import { prisma } from "@/lib/db";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { runNegotiationCopilot } from "@/modules/negotiation-copilot/negotiation.service";
import { runNegotiationAutopilotCore } from "./negotiation-autopilot.engine";
import { getNegotiationContext } from "./negotiation-memory.service";
import { applyNegotiationGuards } from "./negotiation-policy.service";
import type { NegotiationScenario } from "./negotiation-autopilot.types";
import type { NegotiationSuggestion } from "@prisma/client";

function mapDbSuggestionToScenario(row: NegotiationSuggestion): NegotiationScenario {
  const payload = row.payload as {
    recommendedMove?: string;
    rationale?: string[];
    tradeoffs?: string[];
    riskNotes?: string[];
  };
  return {
    scenarioId: row.id,
    title: row.title,
    summary: row.summary,
    ppToCpChanges: [payload.recommendedMove ?? row.summary, ...(payload.rationale ?? []).slice(0, 2)].filter(Boolean),
    pros: payload.rationale ?? [],
    cons: payload.tradeoffs ?? [],
    riskNotes: payload.riskNotes ?? [],
    recommendedUseCase: row.impactEstimate ?? "review",
    brokerApprovalRequired: true,
    sourceEngine: row.suggestionType,
    confidence: row.confidence ?? 0.4,
    riskLevel: (row.riskLevel as NegotiationScenario["riskLevel"]) ?? "medium",
  };
}

export async function runNegotiationAutopilotAssist(dealId: string) {
  const deal = await loadDealForMapper(dealId);
  if (!deal) throw new Error("Deal not found");
  const core = runNegotiationAutopilotCore(deal);
  const ctx = await getNegotiationContext(dealId);
  const guarded = applyNegotiationGuards(core);
  return { ...guarded, threadCount: ctx.threads.length, recentSuggestions: ctx.suggestions.length };
}

/** Persists engine outputs as reviewable rows — scenarioId equals NegotiationSuggestion.id. */
export async function runNegotiationAutopilotPersisted(dealId: string, actorUserId: string) {
  const persisted = await runNegotiationCopilot(dealId, actorUserId);
  const scenarios = persisted.suggestions.map(mapDbSuggestionToScenario);
  return {
    disclaimer: persisted.disclaimer,
    scenarios,
    riskFlags: persisted.riskFlags,
    threadCount: (await getNegotiationContext(dealId)).threads.length,
  };
}

export async function listNegotiationScenariosFromDb(dealId: string) {
  const rows = await prisma.negotiationSuggestion.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return rows.map(mapDbSuggestionToScenario);
}
