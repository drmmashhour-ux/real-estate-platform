import { ClauseExplanation } from "./types";

export function explainClause(args: { 
  sectionKey: string; 
  clauseText: string; 
  context?: any;
}): ClauseExplanation {
  const { sectionKey, clauseText } = args;
  const key = sectionKey.toUpperCase();

  let explanationFr = "Explication de la clause sélectionnée.";
  let risksFr: string[] = [];
  let whatToConfirmFr: string[] = [];
  let plainLanguageSummaryFr = "Résumé simple.";

  if (key.includes("WARRANTY") || key.includes("GARANTIE")) {
    explanationFr = "Cette clause définit la protection contre les vices cachés.";
    risksFr = ["Si exclue, vous achetez l'immeuble tel quel.", "Aucun recours pour vice caché majeur."];
    whatToConfirmFr = ["La condition physique de l'immeuble.", "L'historique des réparations."];
    plainLanguageSummaryFr = "Vous achetez l'immeuble avec ou sans protection contre les défauts graves non visibles.";
  } else if (key.includes("FINANCING") || key.includes("FINANCEMENT")) {
    explanationFr = "Cette clause rend la promesse d'achat conditionnelle à l'obtention d'un prêt.";
    risksFr = ["Si le délai expire, le vendeur peut annuler la promesse d'achat.", "Besoin d'une preuve de refus pour annuler sans pénalité."];
    whatToConfirmFr = ["Le montant du prêt nécessaire.", "Le délai réaliste avec votre banque."];
    plainLanguageSummaryFr = "Si vous n'avez pas votre prêt dans le temps prévu, la vente peut tomber.";
  } else if (key.includes("PARTIES")) {
    explanationFr = "Identifie légalement qui achète et qui vend.";
    risksFr = ["Erreur dans le nom peut invalider le contrat.", "Vérifier si les conjoints doivent signer."];
    whatToConfirmFr = ["Pièces d'identité valides.", "État civil des parties."];
    plainLanguageSummaryFr = "Assure que les bonnes personnes signent le contrat.";
  }

  return {
    explanationFr,
    risksFr,
    whatToConfirmFr,
    plainLanguageSummaryFr: plainLanguageSummaryFr + "\n\nDISCLAIMER: Explication informative — à valider au besoin avec un professionnel autorisé."
  };
}
