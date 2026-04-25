export type RealUserStepId = 
  | "STEP1_LISTING" 
  | "STEP2_OFFER_START" 
  | "STEP3_FINANCING" 
  | "STEP4_NO_BROKER" 
  | "STEP5_WARRANTY_EXCLUSION" 
  | "STEP6_USER_QUESTION" 
  | "STEP7_AI_REVIEW" 
  | "STEP8_EARLY_SIGNATURE" 
  | "STEP9_FIX_AND_SCORE" 
  | "STEP10_PAYMENT" 
  | "STEP11_SIGNATURE_GATE" 
  | "STEP12_FINAL_SUCCESS";

export interface RealUserStep {
  id: RealUserStepId;
  title: string;
  userAction: string;
  leciResponse: string;
  systemUpdate: string;
  complianceScore: number;
  isBlocked?: boolean;
  nextStep: RealUserStepId | null;
}

export const REAL_USER_SCENARIO: Record<RealUserStepId, RealUserStep> = {
  STEP1_LISTING: {
    id: "STEP1_LISTING",
    title: "Ouverture de l'annonce",
    userAction: "L'utilisateur parcourt la propriété.",
    leciResponse: "Je peux vous guider pour préparer une offre étape par étape.",
    systemUpdate: "Initialisation du contexte de l'offre...",
    complianceScore: 20,
    nextStep: "STEP2_OFFER_START"
  },
  STEP2_OFFER_START: {
    id: "STEP2_OFFER_START",
    title: "Démarrage de l'offre",
    userAction: "Clic sur 'Faire une offre'.",
    leciResponse: "Nous allons commencer par les informations essentielles.",
    systemUpdate: "Ouverture du formulaire Turbo Draft.",
    complianceScore: 35,
    nextStep: "STEP3_FINANCING"
  },
  STEP3_FINANCING: {
    id: "STEP3_FINANCING",
    title: "Prix & Financement",
    userAction: "Saisie du prix et des délais.",
    leciResponse: "Le délai de financement doit être clair afin d’éviter une ambiguïté.",
    systemUpdate: "Validation du montant et de la date de financement.",
    complianceScore: 50,
    nextStep: "STEP4_NO_BROKER"
  },
  STEP4_NO_BROKER: {
    id: "STEP4_NO_BROKER",
    title: "Absence de Courtier",
    userAction: "Sélection de 'Non représenté'.",
    leciResponse: "Vous n’êtes pas représenté. Le courtier du vendeur ne protège pas vos intérêts. Vous pouvez demander une révision par un courtier.",
    systemUpdate: "Alerte : Mode Protection Activé.",
    complianceScore: 55,
    nextStep: "STEP5_WARRANTY_EXCLUSION"
  },
  STEP5_WARRANTY_EXCLUSION: {
    id: "STEP5_WARRANTY_EXCLUSION",
    title: "Exclusion de Garantie",
    userAction: "Sélection de 'Sans garantie légale'.",
    leciResponse: "Cette clause réduit certains recours possibles. Une inspection approfondie est recommandée.",
    systemUpdate: "Notice critique générée : Risque élevé détecté.",
    complianceScore: 45, // Score drops because risk added without acknowledgment
    nextStep: "STEP6_USER_QUESTION"
  },
  STEP6_USER_QUESTION: {
    id: "STEP6_USER_QUESTION",
    title: "Question Utilisateur",
    userAction: "Demande : 'Est-ce que c’est correct ?'",
    leciResponse: "Je peux vous aider à comprendre les risques, mais je ne peux pas confirmer la validité finale. Une validation par un courtier ou un professionnel peut être nécessaire.",
    systemUpdate: "Escalade de sécurité : Réponse neutre forcée.",
    complianceScore: 45,
    nextStep: "STEP7_AI_REVIEW"
  },
  STEP7_AI_REVIEW: {
    id: "STEP7_AI_REVIEW",
    title: "Revue AI",
    userAction: "Lancement de la revue automatique.",
    leciResponse: "L'analyse a identifié des points d'amélioration. Il manque une mention sur les inclusions spécifiques.",
    systemUpdate: "Affichage des suggestions et des risques détectés.",
    complianceScore: 60,
    nextStep: "STEP8_EARLY_SIGNATURE"
  },
  STEP8_EARLY_SIGNATURE: {
    id: "STEP8_EARLY_SIGNATURE",
    title: "Tentative de Signature",
    userAction: "Clic sur 'Signer' (prématuré).",
    leciResponse: "La signature est bloquée parce que certains avis ou champs obligatoires ne sont pas complétés.",
    systemUpdate: "BLOCAGE : Signature impossible tant que le score < 80% et notices non lues.",
    complianceScore: 60,
    isBlocked: true,
    nextStep: "STEP9_FIX_AND_SCORE"
  },
  STEP9_FIX_AND_SCORE: {
    id: "STEP9_FIX_AND_SCORE",
    title: "Corrections & Notices",
    userAction: "Lecture des notices et corrections.",
    leciResponse: "Parfait. Maintenant que les risques sont compris et le document complété, votre score s'améliore.",
    systemUpdate: "Validation des notices. Score mis à jour : 85%.",
    complianceScore: 85,
    nextStep: "STEP10_PAYMENT"
  },
  STEP10_PAYMENT: {
    id: "STEP10_PAYMENT",
    title: "Paiement",
    userAction: "Paiement de 15$.",
    leciResponse: "Votre paiement a été validé. Le document final est prêt pour l'exportation certifiée.",
    systemUpdate: "Paiement Stripe OK. Verrouillage levé.",
    complianceScore: 85,
    nextStep: "STEP11_SIGNATURE_GATE"
  },
  STEP11_SIGNATURE_GATE: {
    id: "STEP11_SIGNATURE_GATE",
    title: "Barrière Finale",
    userAction: "Signature finale.",
    leciResponse: "La signature est maintenant valide et associée à un hash d'intégrité immuable.",
    systemUpdate: "Génération PDF... Hash SHA-256 généré... Audit Log mis à jour.",
    complianceScore: 98,
    nextStep: "STEP12_FINAL_SUCCESS"
  },
  STEP12_FINAL_SUCCESS: {
    id: "STEP12_FINAL_SUCCESS",
    title: "Succès Final",
    userAction: "Simulation terminée.",
    leciResponse: "Votre offre a été complétée et sécurisée avec succès. Vous recevrez une notification dès qu'il y aura du nouveau.",
    systemUpdate: "Simulation terminée. Rapport de conformité généré.",
    complianceScore: 100,
    nextStep: null
  }
};
