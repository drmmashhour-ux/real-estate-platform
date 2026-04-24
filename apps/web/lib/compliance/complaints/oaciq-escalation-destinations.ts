import type { ComplaintReferralDestination } from "@/modules/complaints/schemas/escalation-referral.schema";

export type EscalationDestinationMeta = {
  id: ComplaintReferralDestination;
  labelEn: string;
  labelFr: string;
  officialUrl?: string;
  scope: "regulator" | "neutral_guidance" | "discipline" | "internal";
  notesForUsersEn: string;
};

/**
 * Structured compliance-layer destinations (not random links).
 * URLs are informational; product never auto-submits on behalf of users.
 */
export const OACIQ_ESCALATION_DESTINATIONS: EscalationDestinationMeta[] = [
  {
    id: "info_oaciq",
    labelEn: "Info OACIQ",
    labelFr: "Info OACIQ",
    officialUrl: "https://oaciq.com",
    scope: "regulator",
    notesForUsersEn:
      "The Organisme d’autoréglementation du courtage immobilier du Québec answers questions on brokerage rules and professional conduct.",
  },
  {
    id: "public_assistance",
    labelEn: "Public Assistance Department (OACIQ)",
    labelFr: "Service d’assistance au public (OACIQ)",
    officialUrl: "https://oaciq.com/en/public-assistance",
    scope: "neutral_guidance",
    notesForUsersEn:
      "Neutral guidance when consumers want help understanding rights, processes, or informal resolution paths.",
  },
  {
    id: "syndic",
    labelEn: "Syndic (professional conduct)",
    labelFr: "Syndic (déontologie)",
    officialUrl: "https://oaciq.com",
    scope: "discipline",
    notesForUsersEn:
      "The Syndic examines plausible ethical breaches, misrepresentation, trust-account issues, and serious or repeated misconduct.",
  },
  {
    id: "internal_legal",
    labelEn: "Internal legal review",
    labelFr: "Revue juridique interne",
    scope: "internal",
    notesForUsersEn: "Escalation to your brokerage legal counsel for complex or privileged matters.",
  },
  {
    id: "internal_compliance",
    labelEn: "Internal compliance office",
    labelFr: "Conformité interne",
    scope: "internal",
    notesForUsersEn: "Supervised compliance review, AML/trust-account workflows, and policy enforcement.",
  },
];

export function getEscalationDestinationMeta(
  id: ComplaintReferralDestination
): EscalationDestinationMeta | undefined {
  return OACIQ_ESCALATION_DESTINATIONS.find((d) => d.id === id);
}
