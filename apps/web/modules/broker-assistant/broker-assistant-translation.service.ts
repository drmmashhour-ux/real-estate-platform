import type { BrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant.types";

export type MessageTranslationResult = {
  sourceLocale: "EN";
  targetLocale: "FR";
  professionalFr: string;
  notesFr: string;
};

const LEX: [RegExp, string][] = [
  [/thank you for your offer/gi, "Merci pour votre proposition."],
  [/we accept/gi, "Nous acceptons, sous réserve des formalités habituelles et de la validation par le courtier responsable."],
  [/we counter/gi, "Nous présentons une contre-proposition, sous réserve de validation par le courtier responsable."],
  [/inspection/gi, "inspection"],
  [/financing/gi, "financement"],
  [/closing date/gi, "date de clôture"],
  [/please confirm/gi, "Merci de confirmer"],
];

/**
 * Lightweight EN → professional FR path for broker messages (deterministic; LLM may be layered later).
 * Preserves structure; broker must review before sending.
 */
export function translateBrokerMessageEnToProfessionalFr(
  englishText: string,
  _ctx: BrokerAssistantContext,
): MessageTranslationResult {
  let fr = englishText.trim();
  for (const [re, rep] of LEX) {
    fr = fr.replace(re, rep);
  }

  if (fr === englishText.trim()) {
    fr = `[Brouillon — révision requise] ${englishText}\n\nVersion FR professionnelle : veuillez valider la terminologie (promesse d’achat, conditions, échéances) avec votre courtier.`;
  }

  return {
    sourceLocale: "EN",
    targetLocale: "FR",
    professionalFr: fr,
    notesFr:
      "Ce texte est une aide à la rédaction. Le courtier doit valider le ton, les faits et la conformité avant envoi.",
  };
}
