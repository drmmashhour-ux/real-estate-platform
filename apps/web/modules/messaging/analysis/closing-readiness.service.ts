import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import type { DealStageResult } from "@/modules/messaging/analysis/deal-stage-classifier";
import type { ObjectionClassifierResult } from "@/modules/messaging/analysis/objection-classifier";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";
import { messagingAiLog } from "@/modules/messaging/assistant/messaging-ai-logger";

export type ClosingReadinessResult = {
  score: number;
  label: "not_ready" | "progressing" | "near_closing";
  rationale: string[];
};

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * 0–100 progress-style score (heuristic). Not a guarantee of closing. Not financial or legal advice.
 */
export function computeClosingReadiness(
  _conversation: AssistantConversationShape,
  stage: DealStageResult,
  objections: ObjectionClassifierResult,
  insights: ConversationAnalysisResult
): ClosingReadinessResult {
  try {
    let s = 35;
    const rationale: string[] = [];
    s += Math.min(25, insights.engagementScore * 0.25);
    if (insights.engagementScore >= 60) {
      rationale.push("Engagement score is in a healthier band for this model.");
    }
    s += Math.min(15, insights.dealProbability * 0.2);
    if (insights.dealProbability >= 50) {
      rationale.push("The deal-probability model leans above mid-line (heuristic, not a promise of outcome).");
    }
    const unres = objections.objections.filter((o) => o.severity !== "low").length;
    s -= unres * 7;
    if (unres > 0) {
      rationale.push("Open concern signals (by keyword class) can mean more alignment work before a close feel.");
    }
    if (stage.stage === "visit_ready" || stage.stage === "negotiation" || stage.stage === "closing") {
      s += 18;
      rationale.push("Stage read suggests a later funnel position than brand-new discovery.");
    } else if (stage.stage === "objection_handling" || stage.stage === "stalled") {
      s -= 8;
      rationale.push("Objection- or pause-heavy stage read — pace expectations accordingly.");
    } else if (stage.stage === "lost_risk" || stage.stage === "new") {
      s -= 12;
      rationale.push("Early or cool stage read; treat closing readiness as conservative.");
    }
    if (insights.insights.join(" ").toLowerCase().includes("visit") || /schedule|this week/i.test(insights.insights.join(" "))) {
      s += 6;
      rationale.push("Visit- or schedule-style hints add a small nudge in this score.");
    }
    if (insights.sentiment === "POSITIVE" && unres === 0) {
      s += 6;
    }
    const score = clamp100(s);
    let label: ClosingReadinessResult["label"] = "progressing";
    if (score < 40) label = "not_ready";
    else if (score >= 70) label = "near_closing";
    messagingAiLog.closingReadinessComputed({ score, label, stage: stage.stage });
    return { score, label, rationale: rationale.slice(0, 4) };
  } catch (e) {
    messagingAiLog.warn("closing_readiness_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      score: 40,
      label: "progressing",
      rationale: ["A neutral default — review the last few messages and your own notes for the true picture."],
    };
  }
}
