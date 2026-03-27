import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildBrokerAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("broker", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "lead_summary":
      return {
        system:
          system +
          " Summarize ImmoContact / CRM lead: intent, listing context, next step. No promises to consumer.",
        user: `Task: Lead summary.\nContext:\n${userJson}`,
      };
    case "follow_up_draft":
      return {
        system:
          system +
          " Draft a concise professional follow-up message the broker can edit.",
        user: `Task: Follow-up draft.\nContext:\n${userJson}`,
      };
    case "deal_summary":
      return {
        system:
          system +
          " Summarize deal stage, blockers, and suggested next actions.",
        user: `Task: Deal summary.\nContext:\n${userJson}`,
      };
    case "commission_context":
      return {
        system:
          system +
          " Explain lead source, commission eligibility themes, and linked contract requirements at a high level.",
        user: `Task: Commission context summary.\nContext:\n${userJson}`,
      };
    case "comms_draft":
      return {
        system:
          system +
          " Draft buyer/seller communication or appointment follow-up for broker review.",
        user: `Task: Communication draft.\nContext:\n${userJson}`,
      };
    case "next_best_action":
      return {
        system:
          system +
          " Suggest a single next best action for the broker; never imply the platform executed anything.",
        user: `Task: Next best action.\nContext:\n${userJson}`,
      };
    case "pipeline_summary":
      return {
        system:
          system +
          " Summarize lead → conversation → deal from provided thread/stage stats.",
        user: `Task: Pipeline summary.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function brokerOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "lead_summary":
      return "Offline mode: Capture motivation, timeline, financing status, and preferred neighborhoods from the thread.";
    case "follow_up_draft":
      return "Offline mode: Thank them, restate next step, and propose two time options.";
    case "deal_summary":
      return "Offline mode: Check contract milestones, inspection, financing, and deposit conditions.";
    case "commission_context":
      return "Offline mode: Confirm lead origin in CRM and platform contract requirements before quoting commission.";
    case "comms_draft":
      return "Offline mode: Keep messages factual, document material updates, and avoid unverified claims.";
    case "next_best_action":
      return "Offline mode: Reply to the newest qualified lead first; schedule showings for hot listings.";
    case "pipeline_summary":
      return "Offline mode: Count leads by stage and list stalled deals older than 7 days.";
    default:
      return "Offline AI: use CRM notes and platform deal tools for authoritative status.";
  }
}
