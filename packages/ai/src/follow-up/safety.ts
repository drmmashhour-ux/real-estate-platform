/**
 * Detect topics that must be escalated to a licensed broker / professional.
 * Used for SMS reply routing and chat (see also client-communication-chat).
 */

const REGULATED_FINANCING = /\b(will i get approved|approval odds|underwriting|dti|debt to income|rate lock|lock in (a )?rate|stress test|how much (can|will) i borrow|mortgage (approval|denial)|prêt hypothécaire.*approuv)\b/i;

const OFFER_NEGOTIATION = /\b(counter[- ]?offer|negotiate (the )?price|how much (should|to) (offer|bid)|bidding war|inspection (contingency|clause)|due diligence|submit (an )?offer|sign (the )?(purchase|contract)|promise to purchase|promesse d'achat)\b/i;

const VIEWING = /\b(schedule (a )?visit|book (a )?showing|want to (see|view|tour)|property tour|visite|rendez[- ]vous pour visiter|maison ouverte)\b/i;

const CALLBACK = /\b(call me (back|please)?|phone me|callback|rappel|téléphonez|text me only|whatsapp me)\b/i;

const LEGAL_CONTRACT = /\b(interpret (this )?clause|is this contract|legal meaning|notaire|lawyer|attorney|litigation|sue|title defect|easement|zoning (violation|law))\b/i;

/** Housing discrimination — escalate and do not engage with criteria. */
const DISCRIMINATORY = /\b(whites? only|no (black|asian|muslim|jew|arab)|christians? only|no kids|no children|singles only|families only|straight(s)? only|(\d+)\s*kids max|ethnic)\b/i;

export type SafetyEscalation =
  | "regulated_financing"
  | "offer_negotiation"
  | "legal_contract"
  | "viewing_request"
  | "callback_request"
  | "discriminatory"
  | null;

export function classifyInboundSafety(text: string): SafetyEscalation {
  const t = text.trim();
  if (!t) return null;
  if (DISCRIMINATORY.test(t)) return "discriminatory";
  if (LEGAL_CONTRACT.test(t)) return "legal_contract";
  if (REGULATED_FINANCING.test(t)) return "regulated_financing";
  if (OFFER_NEGOTIATION.test(t)) return "offer_negotiation";
  if (VIEWING.test(t)) return "viewing_request";
  if (CALLBACK.test(t)) return "callback_request";
  return null;
}

export const SAFETY_REPLY =
  "A licensed broker will help you with that directly. Reply STOP to opt out of messages.";
