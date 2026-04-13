/**
 * Broker-facing copy — never implies LECIPM is lender, notary, or syndicate authority.
 */

export const COORDINATION_DISCLAIMERS = {
  notLender:
    "LECIPM does not lend money or approve financing. Track lender follow-up here; decisions rest with the lender and parties.",
  notNotary:
    "LECIPM is not a notary. Use this workspace to organize what your notary asked for — not legal advice or notarial acts.",
  brokerControlled:
    "Outbound requests and reminders are drafts until you review and send (or export) them, unless your office enables automated steps.",
} as const;

export function explainTargetRole(role: string): string {
  switch (role) {
    case "LENDER":
      return "Mortgage representative or financial institution contact (external to LECIPM).";
    case "NOTARY":
      return "Notary or notarial staff (external to LECIPM).";
    case "SYNDICATE":
      return "Condo syndicate / co-ownership administrator (external).";
    default:
      return "Transaction participant — follow your brokerage policies.";
  }
}
