/**
 * Plain-language follow-up angles when messaging assist is off — draft-only mindset, no send.
 */

import type { BrokerFollowUpDraftHintKind } from "./broker-next-action.service";

export function plainLanguageDraftGuidance(hint: BrokerFollowUpDraftHintKind): string {
  switch (hint) {
    case "first_contact":
      return "Keep it short: who you are, why you’re reaching out, one clear question. No templates are sent automatically.";
    case "follow_up":
      return "Reference your last touch, add one new piece of value or a simple yes/no question to restart the thread.";
    case "meeting_push":
      return "Offer 2–3 concrete time options or ask what format works — keep asks lightweight.";
    case "revive_lead":
      return "Acknowledge the gap honestly, confirm they still want help, and propose a single low-friction next step.";
    default:
      return "Use your usual tone — the system only suggests angles; you write and send manually.";
  }
}
