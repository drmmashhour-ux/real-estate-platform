/**
 * Deterministic template-based reply drafts — no LLM, no send.
 */

import { aiAutopilotMessagingAssistFlags, brokerClosingFlags } from "@/config/feature-flags";
import type {
  AiMessagingAssistInput,
  AiMessagingAssistResult,
  AiMessagingAssistTone,
} from "./ai-autopilot-messaging.types";
import { logMessagingAssistGeneration, recordGenerationFailure } from "./ai-autopilot-messaging-monitoring.service";

function firstName(full: string): string {
  const t = full.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

function propertyHint(input: AiMessagingAssistInput): string {
  if (input.listingCode?.trim()) return ` (${input.listingCode.trim()})`;
  if (input.listingId?.trim()) return " (your listing inquiry)";
  return "";
}

function tagList(input: AiMessagingAssistInput): string[] {
  const t = input.aiTags;
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

function pickTone(input: AiMessagingAssistInput): AiMessagingAssistTone {
  const tags = tagList(input);
  if (tags.includes("low_info")) return "short";
  if (input.aiPriority === "high" || tags.includes("high_intent")) return "friendly";
  if (input.aiPriority === "medium") return "professional";
  return "professional";
}

function closingDraftFromHint(input: AiMessagingAssistInput, tone: AiMessagingAssistTone): string | null {
  if (!brokerClosingFlags.brokerClosingV1 || !input.followUpDraftHint?.trim()) return null;
  const fn = firstName(input.name);
  const prop = propertyHint(input);
  switch (input.followUpDraftHint) {
    case "first_contact":
      return tone === "short"
        ? `Hi ${fn}, quick note${prop} — I’m reaching out to introduce myself and see how we can help. Reply when convenient.`
        : `Hello ${fn}, thank you for your inquiry${prop}. I wanted to introduce myself and confirm what you’re looking for so we can outline sensible next steps together.`;
    case "follow_up":
      return `Hi ${fn}, following up on my earlier message${prop}. If timing shifted, reply with a better window and I’ll adapt.`;
    case "meeting_push":
      return `Hi ${fn}, thanks for engaging${prop}. If useful, I can propose a few short times for a call — share your preferred days or timezone.`;
    case "revive_lead":
      return `Hi ${fn}, checking in${prop} in case this is still relevant. If not, no problem — a quick “not interested” helps me close the loop.`;
    default:
      return null;
  }
}

function buildRationale(input: AiMessagingAssistInput): string {
  const tags = tagList(input);
  const msgLen = input.message?.trim().length ?? 0;
  if (brokerClosingFlags.brokerClosingV1 && input.closingStage?.trim()) {
    return `Pipeline stage context: ${input.closingStage.trim()} — draft only; you send manually after review.`;
  }
  if (input.aiPriority === "high" || tags.includes("high_intent")) {
    return "Higher-priority lead with usable context for a tailored reply.";
  }
  if (tags.includes("low_info") || msgLen <= 20) {
    return "Low-info lead; asking for clarification without pressure.";
  }
  if (tags.includes("needs_followup")) {
    return "Follow-up suggested based on age/priority signals (draft only — not sent).";
  }
  const ageMs = Date.now() - input.createdAt.getTime();
  if (ageMs < 24 * 60 * 60 * 1000) {
    return "Recent inquiry; concise acknowledgment.";
  }
  return "Standard review reply — no specific outcomes implied.";
}

function confidenceFrom(input: AiMessagingAssistInput): number {
  let c = 0.55;
  if ((input.aiScore ?? 0) >= 70) c += 0.15;
  if (input.phone?.trim()) c += 0.08;
  if ((input.message?.trim().length ?? 0) > 20) c += 0.1;
  return Math.min(0.92, Math.round(c * 100) / 100);
}

/** Safe template bodies — avoid guarantees, legal/financial advice, fake urgency. */
function templates(input: AiMessagingAssistInput, tone: AiMessagingAssistTone): string {
  const fn = firstName(input.name);
  const prop = propertyHint(input);

  if (tone === "short") {
    return `Hi ${fn}, thanks for reaching out${prop}. If you can share a bit more detail, we can review and follow up with next steps.`;
  }
  if (tone === "friendly") {
    return `Hi ${fn}, thanks for your interest. We’ve received your details${prop} and can review them. If anything is missing, reply with a quick update and we’ll take it from there.`;
  }
  return `Hello ${fn}, thank you for your submission. We’ve received your information${prop} and will review it. Please share any additional context you’d like considered as we assess fit and next steps.`;
}

/**
 * Build a single deterministic draft. Does not read/write DB.
 * @param opts.logEach — set false when called from bulk helpers to avoid log spam.
 */
export function buildLeadReplyDraft(
  input: AiMessagingAssistInput,
  opts?: { logEach?: boolean },
): AiMessagingAssistResult | null {
  if (!aiAutopilotMessagingAssistFlags.messagingAssistV1) {
    return null;
  }
  const logEach = opts?.logEach !== false;
  try {
    const useTemplates = aiAutopilotMessagingAssistFlags.messagingTemplatesV1;
    const tone = useTemplates ? pickTone(input) : "professional";
    const suggestedReply = closingDraftFromHint(input, tone) ?? templates(input, tone);
    const rationale = buildRationale(input);
    const createdAt = new Date().toISOString();
    if (logEach) {
      logMessagingAssistGeneration(input.leadId, tone, input.aiPriority ?? null, true);
    }
    return {
      leadId: input.leadId,
      suggestedReply,
      tone,
      rationale,
      confidence: confidenceFrom(input),
      createdAt,
    };
  } catch (e) {
    recordGenerationFailure(input.leadId, e instanceof Error ? e.message : "unknown");
    return null;
  }
}
