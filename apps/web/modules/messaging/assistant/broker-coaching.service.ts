import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import type { DealStageResult } from "@/modules/messaging/analysis/deal-stage-classifier";
import type { ObjectionClassifierResult } from "@/modules/messaging/analysis/objection-classifier";
import type { ConversationRiskHeatmap } from "@/modules/messaging/analysis/risk-heatmap.service";
import type { AssistantConversationShape, MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";
import { messagingAiLog } from "./messaging-ai-logger";

export type CoachingItem = {
  title: string;
  priority: "high" | "medium" | "low";
  rationale: string[];
  recommendedAction: string;
  suggestedApproach?: string;
};

export type BrokerCoaching = {
  coaching: CoachingItem[];
  topCoachingPriority: string | null;
};

export function generateBrokerCoaching(context: {
  conversation: AssistantConversationShape;
  insights: ConversationAnalysisResult;
  objections: ObjectionClassifierResult;
  dealStage: DealStageResult;
  riskHeatmap: ConversationRiskHeatmap;
  clientMemory: MemorySnapshotShape;
}): BrokerCoaching {
  try {
    const c: CoachingItem[] = [];
    const dom = context.objections.dominantObjection;
    if (context.riskHeatmap.overallRisk === "high" && context.riskHeatmap.risks.some((r) => r.key === "low_engagement")) {
      c.push({
        title: "Respond in a short window to protect momentum",
        priority: "high",
        rationale: context.riskHeatmap.risks
          .filter((r) => r.key === "low_engagement" || r.key === "silence_gap")
          .map((r) => r.rationale[0] ?? r.label)
          .slice(0, 1),
        recommendedAction: "Send a brief, value-add check-in; avoid pressure.",
        suggestedApproach: "Acknowledge their last point, offer one concrete help (a slot, a fact sheet), invite a reply on their terms.",
      });
    }
    if (dom === "price") {
      c.push({
        title: "Clarify value and trade-offs before a hard push on viewings (if a visit is the goal next)",
        priority: "high",
        rationale: ["A price concern signal appeared in the automated keyword pass — confirm with the thread before assuming."],
        recommendedAction: "List what the ask includes; invite what would make the numbers feel fairer to them, without a promise of outcome.",
      });
    }
    if (dom === "financing" || context.objections.objections.some((o) => o.type === "financing")) {
      c.push({
        title: "Clarify financing-readiness in neutral language",
        priority: "high",
        rationale: ["This is a conversation flow hint only — you are not determining credit or approval here."],
        recommendedAction: "Offer to align next steps (documents to prepare, who to involve) in general terms, without advising on a loan product.",
        suggestedApproach: "You might suggest they confirm readiness with a qualified professional; you stay in process coordination.",
      });
    }
    if (context.dealStage.stage === "stalled" || context.dealStage.stage === "lost_risk") {
      c.push({
        title: "Gentle re-engagement over pushing the close",
        priority: "high",
        rationale: context.dealStage.rationale.slice(0, 1),
        recommendedAction: "One open question, one next micro-step, no long pitch.",
      });
    }
    if (context.riskHeatmap.risks.some((r) => r.key === "unresolved_objection" && r.level === "high")) {
      c.push({
        title: "Address the stated concern before a bigger ask (e.g. visit) if the thread is sensitive",
        priority: "high",
        rationale: ["The automated pass sees multiple concern classes — your judgment on what comes first is decisive."],
        recommendedAction: "Name their concern, answer factually, then invite the next small step that fits the stage you see.",
      });
    }
    if (context.dealStage.stage === "visit_ready" && (dom === "location" || dom === "property_fit")) {
      c.push({
        title: "Tie a visit to fit questions, not a generic nudge",
        priority: "medium",
        rationale: ["Fit- or place-related objection signals: align the next viewing to what you heard."],
        recommendedAction: "Offer one or two slots and ask for one non-negotiable to respect on the tour.",
        suggestedApproach: "If listing links help, use what your CRM and compliance allow; still no auto-send from the system.",
      });
    }
    if (context.dealStage.stage === "qualified" && !c.some((x) => x.title.includes("listing"))) {
      c.push({
        title: "Qualification follow-up",
        priority: "medium",
        rationale: ["You may have enough to narrow options — check memory vs last messages for consistency."],
        recommendedAction: "Play back budget, area, and type in your words and ask for one missing piece.",
        suggestedApproach: context.clientMemory.profile.preferredArea
          ? `If ${context.clientMemory.profile.preferredArea} is still the focus, confirm before sending more options.`
          : "Confirm the neighborhood or property style they care about most for the next two listings.",
      });
    }
    if (c.length === 0) {
      c.push({
        title: "Keep a steady, helpful touchpoint",
        priority: "low",
        rationale: context.insights.insights.slice(0, 1),
        recommendedAction: "Add one next concrete step the contact can say yes to without feeling rushed.",
      });
    }
    const pr: Record<CoachingItem["priority"], number> = { high: 0, medium: 1, low: 2 };
    const sorted = [...c].sort((a, b) => pr[a.priority] - pr[b.priority]);
    const topCoachingPriority = sorted[0]?.title ?? null;
    messagingAiLog.brokerCoachingGenerated({ n: c.length, top: topCoachingPriority });
    return { coaching: sorted, topCoachingPriority };
  } catch (e) {
    messagingAiLog.warn("broker_coaching_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      coaching: [
        {
          title: "Review the thread in your own words",
          priority: "low",
          rationale: ["A neutral fallback: automation could not add coaching this pass."],
          recommendedAction: "Re-read the last 5 messages, then pick one follow-up the contact can answer easily.",
        },
      ],
      topCoachingPriority: null,
    };
  }
}
