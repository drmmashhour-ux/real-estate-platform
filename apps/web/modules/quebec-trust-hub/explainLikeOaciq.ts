import { ClauseExplanation } from "./types";

export function explainClause(sectionKey: string, clauseText: string): ClauseExplanation {
  const explanations: Record<string, Partial<ClauseExplanation>> = {
    FINANCING: {
      explanationFr: "Cette clause oblige l'acheteur à faire des démarches sérieuses pour obtenir un prêt hypothécaire.",
      risksFr: "Si l'acheteur ne respecte pas les délais, le vendeur peut annuler la promesse d'achat.",
      whatToConfirmFr: "Confirmez avec votre banque que le montant et le délai sont réalistes.",
      plainLanguageSummaryFr: "Pas de financement = Pas de transaction."
    },
    LEGAL_WARRANTY: {
      explanationFr: "La garantie légale protège l'acheteur contre les vices cachés inconnus au moment de la vente.",
      risksFr: "Exclure la garantie signifie que l'acheteur accepte l'immeuble dans l'état où il se trouve, sans recours.",
      whatToConfirmFr: "Voulez-vous vraiment assumer tous les risques de réparations futures ?",
      plainLanguageSummaryFr: "Garantie = Protection contre les surprises coûteuses."
    }
  };

  const base = explanations[sectionKey] || {
    explanationFr: "Cette clause définit les paramètres de votre engagement contractuel.",
    risksFr: "Tout manquement peut entraîner l'annulation de l'entente ou des dommages-intérêts.",
    whatToConfirmFr: "Vérifiez que les termes correspondent à vos intentions réelles.",
    plainLanguageSummaryFr: "Engagement légal standard."
  };

  return {
    explanationFr: base.explanationFr!,
    risksFr: base.risksFr!,
    whatToConfirmFr: base.whatToConfirmFr!,
    plainLanguageSummaryFr: base.plainLanguageSummaryFr!,
    disclaimerFr: "Explication informative — à valider au besoin avec un professionnel autorisé."
  };
}
