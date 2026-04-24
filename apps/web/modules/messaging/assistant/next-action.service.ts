import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import { messagingAiLog } from "./messaging-ai-logger";

export type NextBestActionPriority = "high" | "medium" | "low";

export type NextBestActionResult = {
  action: string;
  priority: NextBestActionPriority;
  rationale: string[];
  suggestedMessage?: string;
};

export type AssistantConversationShape = {
  id: string;
  /** e.g. LISTING, DIRECT */
  type?: string | null;
  /** Last message time (ISO) */
  lastActivityAt?: string | null;
  /** If the last non-system message was from the broker (viewer) */
  lastMessageFromViewer?: boolean;
};

export type MemorySnapshotShape = {
  profile: {
    budget: string | null;
    preferredArea: string | null;
    type: string | null;
  };
  notes: string;
};

const MS_H = 3_600_000;

/**
 * Suggestion-only next step hints for brokers. Heuristic — not legal, financial, or medical advice.
 */
export function getNextBestAction(
  conversation: AssistantConversationShape,
  insights: ConversationAnalysisResult,
  memory: MemorySnapshotShape
): NextBestActionResult {
  try {
    const rationale: string[] = [];
    const now = Date.now();
    const lastAt = conversation.lastActivityAt ? Date.parse(conversation.lastActivityAt) : NaN;
    const hoursSince = Number.isFinite(lastAt) ? (now - lastAt) / MS_H : 0;
    const fromViewer = conversation.lastMessageFromViewer === true;
    const fromCounterparty = conversation.lastMessageFromViewer === false;

    if (fromCounterparty && hoursSince < 2) {
      rationale.push("There is a recent message from the contact — a timely reply may help the conversation move forward.");
      messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "reply_soon" });
      return {
        action: "Reply while the thread is active",
        priority: "high",
        rationale,
        suggestedMessage: "Thanks for your message — I’ll get back to you with the details you asked for shortly.",
      };
    }

    if (fromViewer && hoursSince >= 2 && hoursSince < 72) {
      rationale.push("A brief follow-up can help if there has been a lull in the last day or so.");
      messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "follow_up_window" });
      return {
        action: "Follow up within 2h",
        priority: "high",
        rationale,
        suggestedMessage:
          "Just checking in on our last message — is there a good time for a quick reply or a short call on your end?",
      };
    }

    if (insights.dealProbability >= 55 && insights.insights.some((i) => /visit|momentum|focused/i.test(i))) {
      rationale.push("Engagement and outlook suggest scheduling a concrete next step.");
      messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "schedule" });
      return {
        action: "Schedule visit",
        priority: "high",
        rationale,
        suggestedMessage:
          "Would you like to visit the place this week? I can offer a few time slots that might suit you.",
      };
    }

    if (
      /price|expensive|budget|comparable|objection|hesitat/i.test(insights.insights.join(" ")) ||
      (insights.engagementScore < 50 && /price|timing|clarif/i.test(insights.insights.join(" ")))
    ) {
      rationale.push("The conversation may benefit from clarifying value and listening to concerns (non-binding).");
      messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "objection" });
      return {
        action: "Address possible concern: price or value",
        priority: "high",
        rationale,
        suggestedMessage:
          "Happy to walk through what shapes the ask and what is included, so you can compare clearly — no pressure.",
      };
    }

    if (conversation.type === "LISTING" || (memory.profile.preferredArea && memory.profile.type)) {
      rationale.push("Tie the message to a concrete listing that fits stated preferences, when available.");
      messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "listing" });
      return {
        action: "Send a listing to review",
        priority: "medium",
        rationale,
        suggestedMessage: memory.profile.preferredArea
          ? `I pulled options that may fit ${memory.profile.preferredArea} — want me to send one or two links to compare?`
          : "I can share a listing or two that line up with what you described — should I send them here?",
      };
    }

    rationale.push("Steady, helpful tone; invite the next small step when it feels right.");
    messagingAiLog.nextActionGenerated({ conversationId: conversation.id, kind: "default" });
    return {
      action: "Short check-in",
      priority: "low",
      rationale,
      suggestedMessage: "Thanks for being in touch. What would be most useful for you as a next step on your side?",
    };
  } catch (e) {
    messagingAiLog.warn("next_action_fallback", { err: e instanceof Error ? e.message : String(e) });
    return {
      action: "Review thread and choose a next step",
      priority: "low",
      rationale: ["A neutral fallback — review recent messages and pick a follow-up that fits your style."],
    };
  }
}
