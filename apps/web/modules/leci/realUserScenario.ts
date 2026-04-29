export type RealUserStepId =
  | "STEP1_LISTING"
  | "STEP2_MORTGAGE"
  | "STEP3_INSPECTION"
  | "STEP4_DISCLOSURES"
  | "STEP5_WARRANTY_EXCLUSION"
  | "STEP6_COUNTER"
  | "STEP7_TITLE"
  | "STEP8_EARLY_SIGNATURE"
  | "STEP9_INSURANCE"
  | "STEP10_ADJUSTMENTS"
  | "STEP11_SIGNATURE_GATE"
  | "STEP12_FINAL_SUCCESS";

export type RealUserStep = {
  id: RealUserStepId;
  title: string;
  userAction: string;
  systemUpdate: string;
  leciResponse: string;
  complianceScore: number;
  nextStep?: RealUserStepId;
};

export const REAL_USER_SCENARIO: Record<RealUserStepId, RealUserStep> = {
  STEP1_LISTING: {
    id: "STEP1_LISTING",
    title: "Liste & visite",
    userAction: "Ouvre la fiche projet et confirme quartier + budget.",
    systemUpdate: "Contexte chargé — fiche verrouillée lecture seule.",
    leciResponse:
      "Je vérifie prix affiché vs comparables publics; signale toute anomalie avant offre.",
    complianceScore: 42,
    nextStep: "STEP2_MORTGAGE",
  },
  STEP2_MORTGAGE: {
    id: "STEP2_MORTGAGE",
    title: "Pré-approbation",
    userAction: "Téléverse pré-approbation et taux cible.",
    systemUpdate: "Pré-approbation indexée — plafond utilisé pour scénarios.",
    leciResponse: "OK — j’aligne les conditions suspensives avec la fenêtre de financement.",
    complianceScore: 55,
    nextStep: "STEP3_INSPECTION",
  },
  STEP3_INSPECTION: {
    id: "STEP3_INSPECTION",
    title: "Inspection",
    userAction: "Réserve inspection structure + moisissure.",
    systemUpdate: "Calendrier inspecteur synchronisé avec vendeur.",
    leciResponse:
      "Je note les points sensibles (toit, fondations); gardez latitude pour renégocier si findings matériels.",
    complianceScore: 63,
    nextStep: "STEP4_DISCLOSURES",
  },
  STEP4_DISCLOSURES: {
    id: "STEP4_DISCLOSURES",
    title: "Divulgations",
    userAction: "Lis le formulaire vendeur et signale anomalies.",
    systemUpdate: "Version PDF scellée reçue.",
    leciResponse: "Cartographie des mentions vs fiche technique — rien de bloquant encore.",
    complianceScore: 68,
    nextStep: "STEP5_WARRANTY_EXCLUSION",
  },
  STEP5_WARRANTY_EXCLUSION: {
    id: "STEP5_WARRANTY_EXCLUSION",
    title: "Exclusion garantie",
    userAction: "Le vendeur retire la garantie qualité implicite sur section X.",
    systemUpdate: "Flag critique : clause à risque légal — escalade conformité.",
    leciResponse:
      "Stop : exclusion large. Faites valider par un juriste ou ajustez prix/conditions — je ne peux pas vous dire d’accepter aveuglément.",
    complianceScore: 58,
    nextStep: "STEP6_COUNTER",
  },
  STEP6_COUNTER: {
    id: "STEP6_COUNTER",
    title: "Contre-offre",
    userAction: "Propose baisse prix + crédit réparation.",
    systemUpdate: "Brouillon envoyé via messagerie conforme.",
    leciResponse:
      "Bon réflexe — documente chaque promesse orale par écrit avant signature.",
    complianceScore: 70,
    nextStep: "STEP7_TITLE",
  },
  STEP7_TITLE: {
    id: "STEP7_TITLE",
    title: "Titre & charges",
    userAction: "Commande recherche titre accélérée.",
    systemUpdate: "Rapport titre reçu — hypothèques listées.",
    leciResponse:
      "Soulève servitudes actives; assurez décharge ou marge monétaire à la clôture.",
    complianceScore: 76,
    nextStep: "STEP8_EARLY_SIGNATURE",
  },
  STEP8_EARLY_SIGNATURE: {
    id: "STEP8_EARLY_SIGNATURE",
    title: "Signature hâtive",
    userAction: "Courtier pousse signature immédiate avant financement final.",
    systemUpdate: "ALERTE — pression temporelle incompatible garde-fous internes.",
    leciResponse:
      "Refusez une signature complète tant que la condition financement n’est pas sans condition; c’est un signal rouge.",
    complianceScore: 60,
    nextStep: "STEP9_INSURANCE",
  },
  STEP9_INSURANCE: {
    id: "STEP9_INSURANCE",
    title: "Assurances",
    userAction: "Lie police habitation + responsabilité avant transfert.",
    systemUpdate: "Attestation requise ajoutée aux conditions suspensives.",
    leciResponse: "Parfait — je garde une copie chiffrée pour la preuve d’assurance à la clôture.",
    complianceScore: 74,
    nextStep: "STEP10_ADJUSTMENTS",
  },
  STEP10_ADJUSTMENTS: {
    id: "STEP10_ADJUSTMENTS",
    title: "Ajustements",
    userAction: "Valide taxes et compteurs pour déclaration du notaire.",
    systemUpdate: "Relevés intégrés — écart <2% vs budget.",
    leciResponse:
      "Je confirme les pro-rata taxes et frais : rien d’inhabituel aux comptes préliminaires.",
    complianceScore: 81,
    nextStep: "STEP11_SIGNATURE_GATE",
  },
  STEP11_SIGNATURE_GATE: {
    id: "STEP11_SIGNATURE_GATE",
    title: "Porte signature",
    userAction: "Contrôle final checklist notaire + preuves de fonds.",
    systemUpdate: "Tous feux verts conformité — jeton signature émis.",
    leciResponse:
      "Vous pouvez parapher : garde-fous satisfeints, copies versifiées et archivées.",
    complianceScore: 92,
    nextStep: "STEP12_FINAL_SUCCESS",
  },
  STEP12_FINAL_SUCCESS: {
    id: "STEP12_FINAL_SUCCESS",
    title: "Clôture réussie",
    userAction: "Télécharge l’acte signé et mandats post-clôture.",
    systemUpdate: "Dossier clôturé — preuves distribuées aux parties.",
    leciResponse:
      "Félicitations — je reste disponible pour rappeler échéances fiscales locales (rappel général, pas conseil juridique).",
    complianceScore: 98,
  },
};
