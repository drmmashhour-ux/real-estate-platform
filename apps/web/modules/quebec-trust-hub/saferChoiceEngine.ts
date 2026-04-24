import { TurboDraftInput, TurboDraftResult } from "../turbo-form-drafting/types";
import { SaferChoice } from "./types";

export function generateSaferChoices(input: TurboDraftInput, result: TurboDraftResult): SaferChoice[] {
  const choices: SaferChoice[] = [];
  const { answers, representedStatus } = input;

  // 1. Warranty
  if (answers.withoutWarranty === true) {
    choices.push({
      issueKey: "WARRANTY_EXCLUSION",
      currentRisk: "Vente sans garantie légale : l'acheteur perd ses recours pour vices cachés.",
      saferOptionFr: "Vendre avec garantie légale, ou exclure seulement certains éléments spécifiques.",
      reasonFr: "Offrir une garantie augmente la valeur perçue et réduit les risques de litiges futurs.",
      actionRequired: false
    });
  }

  // 2. Representation
  if (representedStatus === "NOT_REPRESENTED") {
    choices.push({
      issueKey: "BUYER_NOT_REPRESENTED",
      currentRisk: "Vous n'êtes pas représenté par un courtier. Vous gérez seul les aspects légaux complexes.",
      saferOptionFr: "Demander à un courtier partenaire de réviser votre offre (Service Broker Assist).",
      reasonFr: "Un professionnel peut détecter des anomalies que vous pourriez manquer.",
      actionRequired: true
    });
  }

  // 3. Financing Delay
  if (answers.financingRequired && answers.financingDelay && parseInt(answers.financingDelay) < 10) {
    choices.push({
      issueKey: "SHORT_FINANCING_DELAY",
      currentRisk: "Le délai de financement est très court. Risque de caducité de l'offre.",
      saferOptionFr: "Prévoir au moins 15 jours pour obtenir une lettre de confirmation bancaire.",
      reasonFr: "Les banques mettent souvent plus de 10 jours pour finaliser un dossier complet.",
      actionRequired: false
    });
  }

  // 4. Inclusions ambiguity
  if (answers.inclusions && answers.inclusions.toLowerCase().includes("électro")) {
    choices.push({
      issueKey: "VAGUE_INCLUSIONS",
      currentRisk: "Les 'électros' sont une source fréquente de litiges (marques, modèles, état).",
      saferOptionFr: "Détailler : Marque, Modèle et Année (ex: Réfrigérateur Samsung RF28).",
      reasonFr: "Une description précise évite les substitutions avant le passage chez le notaire.",
      actionRequired: false
    });
  }

  return choices;
}
