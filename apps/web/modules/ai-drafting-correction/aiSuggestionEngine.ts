import type { AiCorrectionSuggestion, AiDraftInput, AiRiskFinding } from "@/modules/ai-drafting-correction/types";

const MISSING = "[INFORMATION MANQUANTE À CONFIRMER]";

export function buildSuggestionsFromFindings(
  findings: AiRiskFinding[],
  input: AiDraftInput
): AiCorrectionSuggestion[] {
  const out: AiCorrectionSuggestion[] = [];
  for (const f of findings) {
    out.push({
      suggestionKey: `fix:${f.findingKey}`,
      fieldKey: f.sectionKey,
      messageFr: f.suggestedFixFr ?? f.messageFr,
      messageEn: f.suggestedFixEn ?? f.messageEn,
      actionType: f.blocking ? "blocking_fix" : "clarify",
      severity: f.severity,
    });
  }

  const t = JSON.stringify(input.answers ?? {}).toLowerCase();
  if (!t.includes("borne") && !t.includes("charger") && /recharge|ev\b/i.test(JSON.stringify(input.draftSections))) {
    out.push({
      suggestionKey: "clarify_ev_charger",
      fieldKey: "chattels.evCharger",
      messageFr: "Clarifier si la borne de recharge est incluse ou exclue (et le câblage associé).",
      messageEn: "Clarify whether the EV charger (and wiring) is included or excluded.",
      actionType: "clarify_inclusion",
      severity: "WARNING",
    });
  }

  if (input.transactionContext?.buyerRepresented === false) {
    out.push({
      suggestionKey: "confirm_buyer_representation",
      fieldKey: "representation.buyerRepresented",
      messageFr: "Confirmer si l’acheteur est représenté et afficher l’avis sur le rôle limité du courtier si non.",
      messageEn: "Confirm buyer representation and show limited-role broker notice if not represented.",
      actionType: "compliance_notice",
      severity: "CRITICAL",
    });
  }

  if (!JSON.stringify(input.answers ?? {}).includes("financement") && /financement/i.test(JSON.stringify(input.draftSections))) {
    out.push({
      suggestionKey: "add_financing_delay",
      fieldKey: "financing.delayDays",
      messageFr: "Ajouter un délai de financement explicite (jours ouvrables).",
      messageEn: "Add an explicit financing delay (business days).",
      actionType: "add_field",
      severity: "WARNING",
    });
  }

  return out;
}

export { MISSING as AI_MISSING_FACT_MARKER };
