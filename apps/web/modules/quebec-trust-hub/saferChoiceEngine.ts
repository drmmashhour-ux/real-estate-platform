import { SaferChoice } from "./types";

export function generateSaferChoices(context: any): SaferChoice[] {
  const choices: SaferChoice[] = [];
  const { answers, representedStatus, resultJson } = context;

  // 1. Warranty exclusion
  if (answers?.withoutWarranty) {
    choices.push({
      issueKey: "WARRANTY_EXCLUSION",
      currentRisk: "Vente sans garantie légale (risques élevés pour l'acheteur).",
      saferOptionFr: "Vente avec garantie légale, ou exclusion partielle.",
      reasonFr: "La garantie légale protège contre les vices cachés. L'exclure totalement limite vos recours.",
      actionRequired: true
    });
  }

  // 2. Unrepresented buyer
  if (representedStatus === "NOT_REPRESENTED") {
    choices.push({
      issueKey: "BUYER_NOT_REPRESENTED",
      currentRisk: "Acheteur agissant seul (traitement équitable seulement).",
      saferOptionFr: "Engager un courtier pour vous représenter.",
      reasonFr: "Un courtier à votre service a l'obligation de protéger vos intérêts et de vous conseiller.",
      actionRequired: true
    });
  }

  // 3. Short financing delay
  if (answers?.financingRequired && answers?.financingDelay && parseInt(answers.financingDelay) < 10) {
    choices.push({
      issueKey: "SHORT_FINANCING",
      currentRisk: `Délai de financement court (${answers.financingDelay} jours).`,
      saferOptionFr: "Augmenter le délai à 10 ou 14 jours.",
      reasonFr: "Les banques ont souvent besoin de plus de temps pour traiter une demande complète.",
      actionRequired: false
    });
  }

  // 4. EV Charger ambiguity
  if (answers?.inclusions && answers.inclusions.toLowerCase().includes("borne") && !answers.inclusions.toLowerCase().includes("recharge")) {
     choices.push({
      issueKey: "EV_CHARGER",
      currentRisk: "Ambiguité sur la borne de recharge.",
      saferOptionFr: "Préciser s'il s'agit d'une borne de recharge pour VE.",
      reasonFr: "Les bornes de recharge sont souvent un point de litige si non spécifiées.",
      actionRequired: false
    });
  }

  return choices;
}
