import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import type { ObjectionClassifierResult } from "@/modules/messaging/analysis/objection-classifier";
import type { MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";
import { messagingAiLog } from "@/modules/messaging/assistant/messaging-ai-logger";

export type DealStage =
  | "new"
  | "discovery"
  | "qualified"
  | "objection_handling"
  | "visit_ready"
  | "negotiation"
  | "closing"
  | "stalled"
  | "lost_risk";

export type DealStageResult = {
  stage: DealStage;
  /** 0–1 */
  confidence: number;
  rationale: string[];
};

export type StageMessage = { body: string; createdAt: string; senderId: string; counterpartyId: string; viewerId: string };

const DISC_RE = /\b(what|how|when|where|why|could you|tell me|interested|looking for|search|options|criteria)\b/i;
const QUAL_RE = /\b(budget|range|afford|area|neighborhood|bedroom|bath|sqm|type|villa|apartment)\b/i;
const VISIT_RE = /\b(visit|viewing|see (the )?place|tour|walk[- ]?through|schedule|slot|tomorrow|this week)\b/i;
const NEGO_RE = /\b(offer|term|conditions?|deduct|counter|escrow|negotiat)\b/i;
const CLOS_RE = /\b(close|sign|keys|move[- ]?in|paperwork|notary|handover|final(ize)?)\b/i;

/**
 * Heuristic deal stage. Not a prediction of deal outcome. Avoids over-claiming.
 */
export function classifyDealStage(
  messages: StageMessage[],
  insights: ConversationAnalysisResult,
  memory: MemorySnapshotShape,
  objections: ObjectionClassifierResult
): DealStageResult {
  try {
    const rationale: string[] = [];
    const cpTexts = messages.filter((m) => m.senderId === m.counterpartyId);
    const blob = cpTexts
      .map((m) => m.body)
      .join("\n")
      .slice(-12000);
    const allBlob = messages
      .map((m) => m.body)
      .join("\n")
      .slice(-12000);

    const now = Date.now();
    const times = messages.map((m) => new Date(m.createdAt).getTime());
    const lastT = times.length > 0 ? Math.max(...times) : 0;
    const spanDays = (() => {
      if (times.length < 2) return 0;
      const t0 = Math.min(...times);
      return (lastT - t0) / 86_400_000;
    })();
    const lastGapDays = times.length >= 1 ? (now - lastT) / 86_400_000 : 0;

    const nMessages = messages.length;
    const nHigh = objections.objections.filter((o) => o.severity === "high").length;
    const nOb = objections.objections.length;
    const strongObj = nOb >= 2 || nHigh >= 1;
    const budgetKnown = Boolean(memory.profile.budget?.trim());
    const areaKnown = Boolean(memory.profile.preferredArea?.trim());
    const typeKnown = Boolean(memory.profile.type?.trim());
    const qualifiedSignal = (budgetKnown || areaKnown) && (typeKnown || /property|apartment|house|condo/i.test(blob));

    if (nMessages <= 2 && spanDays < 2) {
      rationale.push("Short thread, early exchange.");
      messagingAiLog.dealStageClassified({ stage: "new" });
      return { stage: "new", confidence: 0.55, rationale };
    }
    if (lastGapDays > 5 && (insights.engagementScore < 40 || /hesitat|not sure|later/i.test(blob))) {
      rationale.push("Long gap since last message; engagement looks soft.");
      messagingAiLog.dealStageClassified({ stage: "lost_risk" });
      return { stage: "lost_risk", confidence: 0.5, rationale };
    }
    if (lastGapDays > 2 && nMessages > 2) {
      rationale.push("A few days of silence; momentum may be pausing.");
      messagingAiLog.dealStageClassified({ stage: "stalled" });
      return { stage: "stalled", confidence: 0.5, rationale };
    }
    if (NEGO_RE.test(blob) && nMessages > 3) {
      rationale.push("Process or terms language in recent messages (heuristic, not a legal read).");
      messagingAiLog.dealStageClassified({ stage: "negotiation" });
      return { stage: "negotiation", confidence: 0.5, rationale };
    }
    if (CLOS_RE.test(blob) && nMessages > 2) {
      rationale.push("Closing- or handover-style wording appeared.");
      messagingAiLog.dealStageClassified({ stage: "closing" });
      return { stage: "closing", confidence: 0.45, rationale };
    }
    if (VISIT_RE.test(blob) || (VISIT_RE.test(allBlob) && nMessages > 1)) {
      rationale.push("Scheduling or visit phrasing in the thread.");
      messagingAiLog.dealStageClassified({ stage: "visit_ready" });
      return { stage: "visit_ready", confidence: 0.55, rationale };
    }
    if (strongObj) {
      rationale.push("One or more objection signals; conversation may be in a clarifying mode.");
      messagingAiLog.dealStageClassified({ stage: "objection_handling" });
      return { stage: "objection_handling", confidence: 0.55, rationale };
    }
    if (qualifiedSignal) {
      rationale.push("Some preferences (budget, area, or type) are visible in text or memory.");
      messagingAiLog.dealStageClassified({ stage: "qualified" });
      return { stage: "qualified", confidence: 0.55, rationale };
    }
    if (DISC_RE.test(blob) && nMessages < 8) {
      rationale.push("Exploratory or question-style messages.");
      messagingAiLog.dealStageClassified({ stage: "discovery" });
      return { stage: "discovery", confidence: 0.5, rationale };
    }
    if (QUAL_RE.test(blob)) {
      rationale.push("Qualification-style language without full memory fit yet.");
      messagingAiLog.dealStageClassified({ stage: "qualified" });
      return { stage: "qualified", confidence: 0.45, rationale };
    }
    rationale.push("Default: treat as early discovery until more signals appear.");
    messagingAiLog.dealStageClassified({ stage: "discovery" });
    return { stage: "discovery", confidence: 0.4, rationale };
  } catch (e) {
    messagingAiLog.warn("deal_stage_error", { err: e instanceof Error ? e.message : String(e) });
    return { stage: "new", confidence: 0.3, rationale: ["Simplified default due to a classification fallback."] };
  }
}
