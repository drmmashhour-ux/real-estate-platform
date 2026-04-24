import { detectMissingInformation } from "@/modules/broker-assistant/broker-assistant-checklist.service";
import { suggestClauseCategoriesForContext } from "@/modules/broker-assistant/broker-assistant-clauses.service";
import { evaluateBrokerAssistantCompliance } from "@/modules/broker-assistant/broker-assistant-compliance.service";
import { buildDraftingSuggestions } from "@/modules/broker-assistant/broker-assistant-drafting.service";
import type { BrokerAssistantContext, BrokerAssistantOutput, BrokerAssistantRunOptions } from "@/modules/broker-assistant/broker-assistant.types";

const CONFIDENCE_FLOOR = 0.35;
const LOW_CONFIDENCE_NOTE_FR =
  "Niveau de confiance faible : révision humaine obligatoire avant toute action engageante.";
const LOW_CONFIDENCE_NOTE_EN = "Low confidence: mandatory human review before any binding action.";

function confidenceFrom(missingCount: number, hasBlocker: boolean, draftEmpty: boolean): number {
  let c = 1;
  c -= Math.min(0.45, missingCount * 0.07);
  if (hasBlocker) c -= 0.35;
  if (draftEmpty) c -= 0.05;
  return Math.max(0, Math.min(1, Math.round(c * 100) / 100));
}

function nextStepsFrom(ctx: BrokerAssistantContext, missing: { id: string }[]): BrokerAssistantOutput["suggestedNextSteps"] {
  const steps: BrokerAssistantOutput["suggestedNextSteps"] = [];
  if (missing.some((m) => m.id === "financing_deadline")) {
    steps.push({
      id: "ns_financing",
      stepFr: "Compléter l’échéance de financement et la faire valider par le courtier.",
      stepEn: "Complete the financing deadline and have the broker validate it.",
      requiresBrokerApproval: true,
    });
  }
  if (missing.some((m) => m.id === "property_address")) {
    steps.push({
      id: "ns_address",
      stepFr: "Saisir l’adresse cadastrale complète dans le dossier.",
      stepEn: "Enter the full civic address in the file.",
      requiresBrokerApproval: false,
    });
  }
  if (ctx.documentType === "promise_to_purchase") {
    steps.push({
      id: "ns_oaciq_forms",
      stepFr: "Vérifier les formulaires OACIQ applicables et la déclaration du vendeur si requise.",
      stepEn: "Verify applicable OACIQ forms and seller declaration if required.",
      requiresBrokerApproval: true,
    });
  }
  return steps;
}

/**
 * Core orchestration — deterministic guidance; safe to call from APIs.
 */
export async function runBrokerAssistant(
  ctx: BrokerAssistantContext,
  opts: BrokerAssistantRunOptions = {},
): Promise<BrokerAssistantOutput> {
  const missingInformation = detectMissingInformation(ctx);
  const { level: complianceLevel, flags: complianceFlags } = evaluateBrokerAssistantCompliance(ctx, missingInformation);

  const draftingSuggestions =
    opts.includeDrafting === false ? [] : buildDraftingSuggestions(ctx);

  const suggestedClauses =
    opts.includeClauses === false ? [] : await suggestClauseCategoriesForContext(ctx);

  const hasBlocker = complianceFlags.some((f) => f.level === "blocker");
  const draftEmpty = !ctx.currentDraftText?.trim();
  const confidenceScore = confidenceFrom(missingInformation.length, hasBlocker, draftEmpty);

  const disclaimersFr = [
    "L’assistant ne remplace pas le jugement du courtier ni l’avis juridique.",
    "Les brouillons sont fournis à des fins de révision uniquement.",
  ];
  const disclaimersEn: string[] = [
    "The assistant does not replace broker judgment or legal advice.",
    "Drafts are for review only.",
  ];

  if (confidenceScore < CONFIDENCE_FLOOR) {
    disclaimersFr.push(LOW_CONFIDENCE_NOTE_FR);
    disclaimersEn.push(LOW_CONFIDENCE_NOTE_EN);
  }

  const summaryFr =
    missingInformation.length === 0 && complianceLevel === "safe"
      ? "Dossier résidentiel : peu d’écarts détectés par l’assistant — validez tout de même avant engagement."
      : `Analyse résidentielle Québec : ${missingInformation.length} information(s) à compléter ou confirmer; niveau de conformité assistive : ${complianceLevel}.`;

  const summaryEn =
    missingInformation.length === 0 && complianceLevel === "safe"
      ? "Residential file: few gaps detected — still validate before binding steps."
      : `Québec residential scan: ${missingInformation.length} item(s) to complete or confirm; assistive compliance level: ${complianceLevel}.`;

  return {
    status: "READY_FOR_REVIEW",
    complianceLevel,
    summaryFr,
    summaryEn,
    missingInformation,
    complianceFlags,
    suggestedClauses,
    suggestedNextSteps: nextStepsFrom(ctx, missingInformation),
    draftingSuggestions,
    confidenceScore,
    disclaimersFr,
    disclaimersEn,
  };
}
