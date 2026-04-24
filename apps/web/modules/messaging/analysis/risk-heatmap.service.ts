import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import type { DealStageResult } from "@/modules/messaging/analysis/deal-stage-classifier";
import type { ObjectionClassifierResult } from "@/modules/messaging/analysis/objection-classifier";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";
import { messagingAiLog } from "@/modules/messaging/assistant/messaging-ai-logger";

export type RiskLevel = "low" | "medium" | "high";

export type RiskItem = { key: string; label: string; level: RiskLevel; rationale: string[] };

export type ConversationRiskHeatmap = {
  overallRisk: RiskLevel;
  riskScore: number;
  risks: RiskItem[];
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export type RiskGapHints = {
  avgResponseMinutes: number | null;
  lastGapHours: number | null;
};

/**
 * Composable, explainable risk list — heuristics only, not a legal or credit risk score.
 */
export function buildConversationRiskHeatmap(
  _conversation: AssistantConversationShape,
  insights: ConversationAnalysisResult,
  objections: ObjectionClassifierResult,
  stage: DealStageResult,
  gaps?: RiskGapHints
): ConversationRiskHeatmap {
  try {
    const avgResponseMinutes = gaps?.avgResponseMinutes ?? null;
    const lastGapHours = gaps?.lastGapHours ?? null;
    const sentimentNegative = insights.sentiment === "NEGATIVE";
    const hesitation = /hesitat|not sure|maybe|later|think about/i.test(insights.insights.join(" "));
    const engagementScore = insights.engagementScore;
    const objectionCount = objections.objections.length;
    const hasUnresolvedHighObjection = objections.objections.some((o) => o.severity === "high");
    const clientPrefInconsistent = /inconsistent|changed mind|not sure|different area|another budget/i.test(
      insights.insights.join(" ")
    );
    const financingUncertain = objections.objections.some((o) => o.type === "financing");
    const hasCompetitor = objections.objections.some((o) => o.type === "competition");

    const risks: RiskItem[] = [];
    if (avgResponseMinutes != null && avgResponseMinutes > 120) {
      risks.push({
        key: "slow_broker",
        label: "Slow reply pattern",
        level: avgResponseMinutes > 24 * 60 ? "high" : "medium",
        rationale: [
          "Average time between a contact message and your reply looks long for this thread (heuristic, not a KPI guarantee).",
        ],
      });
    }
    if (lastGapHours != null && lastGapHours > 48) {
      risks.push({
        key: "silence_gap",
        label: "Long silence",
        level: lastGapHours > 120 ? "high" : "medium",
        rationale: [
          "Last activity was some time ago; a short check-in may help, without assuming why they went quiet.",
        ],
      });
    }
    if (hesitation) {
      risks.push({
        key: "hesitation",
        label: "Contact hesitation",
        level: "medium",
        rationale: ["Hesitation-style wording appeared in the conversation hints."],
      });
    }
    if (hasUnresolvedHighObjection) {
      risks.push({
        key: "unresolved_objection",
        label: "Strong objection signals",
        level: "high",
        rationale: [
          "At least one high-severity objection class was heuristically detected; verify with your read of the full thread.",
        ],
      });
    } else if (objectionCount >= 2) {
      risks.push({
        key: "unresolved_objection",
        label: "Multiple concern signals",
        level: "medium",
        rationale: ["More than one objection class triggered — pace next steps with clarity, not pressure."],
      });
    }
    if (engagementScore < 40) {
      risks.push({
        key: "low_engagement",
        label: "Low engagement score",
        level: "high",
        rationale: ["The engagement model scores this thread below average; treat as a nudge, not a verdict."],
      });
    } else if (engagementScore < 60) {
      risks.push({
        key: "low_engagement",
        label: "Moderate engagement",
        level: "medium",
        rationale: ["Engagement is middling; consider a value-add follow-up that fits the stage you see."],
      });
    }
    if (clientPrefInconsistent) {
      risks.push({
        key: "inconsistent_preferences",
        label: "Possibly moving criteria",
        level: "medium",
        rationale: ["Wording may suggest moving criteria; confirm in plain language, without profiling the person."],
      });
    }
    if (financingUncertain) {
      risks.push({
        key: "financing_unsure",
        label: "Financing phrasing",
        level: "medium",
        rationale: [
          "Financing-related phrasing was detected. This is not a credit decision — it is a conversation hint only.",
        ],
      });
    }
    if (hasCompetitor) {
      risks.push({
        key: "competition",
        label: "Comparative options",
        level: "medium",
        rationale: ["The contact may be comparing; focus on clear next step and what you can verify."],
      });
    }
    if (sentimentNegative && stage.stage === "lost_risk") {
      risks.push({
        key: "sentiment_momentum",
        label: "Colder tone and stalled",
        level: "high",
        rationale: [
          "Negative phrasing in hints plus a stalled/muted stage read — be concise and respectful, not pushy.",
        ],
      });
    } else if (sentimentNegative) {
      risks.push({
        key: "client_tone",
        label: "Colder or tense tone in hints",
        level: hesitation ? "high" : "medium",
        rationale: ["The sentiment model flags a cooler or tenser read — treat as a listening cue, not a label."],
      });
    }
    if (risks.length === 0) {
      risks.push({
        key: "no_major_flag",
        label: "No major automated flags",
        level: "low",
        rationale: [
          "No high-severity heuristics tripped. Still review the last messages before acting; automation misses nuance.",
        ],
      });
    }

    const sev: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
    const max = Math.max(0, ...risks.map((r) => sev[r.level]));
    const mean = risks.reduce((a, r) => a + sev[r.level] / 2, 0) / Math.max(1, risks.length);
    const riskScore = Math.round(100 * clamp(0.15 + 0.35 * mean + 0.1 * (max / 2)));
    let overallRisk: RiskLevel = "low";
    if (riskScore >= 65) overallRisk = "high";
    else if (riskScore >= 40) overallRisk = "medium";

    messagingAiLog.riskHeatmapBuilt({ n: risks.length, riskScore, overall: overallRisk });
    return { overallRisk, riskScore, risks: risks.slice(0, 10) };
  } catch (e) {
    messagingAiLog.warn("risk_heatmap_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      overallRisk: "low",
      riskScore: 25,
      risks: [
        {
          key: "fallback",
          label: "Limited data",
          level: "low",
          rationale: ["A neutral fallback: read the thread and apply your judgment. No automated blockers are implied here."],
        },
      ],
    };
  }
}
