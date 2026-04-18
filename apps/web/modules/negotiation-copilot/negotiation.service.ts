import { prisma } from "@/lib/db";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { runNegotiationEngine } from "./negotiation-engine";
import { extractPpNegotiationFields } from "./integrations/pp-negotiation-linker.service";
import { negotiationDisclaimer } from "./negotiation-explainer";
import { logNegotiationEvent } from "./negotiation-audit.service";

export async function runNegotiationCopilot(dealId: string, actorUserId: string) {
  const deal = await loadDealForMapper(dealId);
  if (!deal) throw new Error("Deal not found");
  const canonical = buildCanonicalDealShape(deal);
  const ppMap = mapFormByKey("PP", canonical);
  const ppFields = extractPpNegotiationFields(ppMap);
  const { outputs, riskFlags } = runNegotiationEngine({
    ppMap: ppFields,
    deal: canonical,
    daysOnMarket: null,
  });

  const created = [];
  for (const o of outputs) {
    const row = await prisma.negotiationSuggestion.create({
      data: {
        dealId,
        suggestionType: o.suggestionType,
        title: o.title,
        summary: o.summary,
        payload: o.payload as object,
        confidence: o.confidence,
        impactEstimate: o.impactEstimate,
        riskLevel: o.riskLevel,
        sourceReferences: [{ engine: "negotiation_v1" }],
        status: "pending_review",
      },
    });
    created.push(row);
  }

  await logNegotiationEvent(dealId, "negotiation_suggestions_generated", { count: created.length }, actorUserId);

  return {
    disclaimer: negotiationDisclaimer(),
    suggestions: created,
    riskFlags,
  };
}

export async function approveSuggestion(input: { dealId: string; suggestionId: string; actorUserId: string }) {
  const s = await prisma.negotiationSuggestion.findFirst({
    where: { id: input.suggestionId, dealId: input.dealId },
  });
  if (!s) throw new Error("Suggestion not found");
  const updated = await prisma.negotiationSuggestion.update({
    where: { id: input.suggestionId },
    data: { status: "approved" },
  });
  await logNegotiationEvent(input.dealId, "negotiation_suggestion_approved", { suggestionId: s.id }, input.actorUserId);
  return updated;
}

export async function rejectSuggestion(input: { dealId: string; suggestionId: string; actorUserId: string }) {
  const updated = await prisma.negotiationSuggestion.update({
    where: { id: input.suggestionId },
    data: { status: "rejected" },
  });
  await logNegotiationEvent(input.dealId, "negotiation_suggestion_rejected", { suggestionId: input.suggestionId }, input.actorUserId);
  return updated;
}

export async function createNegotiationRound(input: {
  dealId: string;
  initiatingParty: string;
  summary: Record<string, unknown>;
  actorUserId: string;
}) {
  const thread =
    (await prisma.negotiationThread.findFirst({ where: { dealId: input.dealId, status: "active" } })) ??
    (await prisma.negotiationThread.create({
      data: { dealId: input.dealId, status: "active", currentRound: 0 },
    }));

  const next = thread.currentRound + 1;
  const round = await prisma.negotiationRound.create({
    data: {
      threadId: thread.id,
      roundNumber: next,
      initiatingParty: input.initiatingParty,
      status: "open",
      summary: input.summary as object,
    },
  });
  await prisma.negotiationThread.update({
    where: { id: thread.id },
    data: { currentRound: next },
  });
  await logNegotiationEvent(input.dealId, "negotiation_round_created", { roundId: round.id }, input.actorUserId);
  return round;
}
