export type SimulationStep = 
  | "LISTING" 
  | "DRAFTING" 
  | "RISK_SITUATION" 
  | "USER_QUESTION" 
  | "AI_REVIEW" 
  | "COMPLIANCE_SCORE" 
  | "PROTECTION_MODE" 
  | "PAYMENT" 
  | "SIGNATURE_GATE" 
  | "SUCCESS" 
  | "AUDIT_TRAIL";

export interface FlowState {
  currentStep: SimulationStep;
  complianceScore: number;
  noticesAcknowledged: string[];
  paymentCompleted: boolean;
  requiredFieldsFilled: boolean;
  isRepresented: boolean;
  leciMessages: { role: "user" | "leci", content: string, status?: "SAFE" | "UNSAFE" | "IMPROVE" }[];
  systemLogs: { timestamp: string, action: string, type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS" }[];
}

export const INITIAL_STATE: FlowState = {
  currentStep: "LISTING",
  complianceScore: 45,
  noticesAcknowledged: [],
  paymentCompleted: false,
  requiredFieldsFilled: false,
  isRepresented: false,
  leciMessages: [],
  systemLogs: [{ timestamp: new Date().toLocaleTimeString(), action: "Simulation started", type: "INFO" }]
};

export interface StepDefinition {
  id: SimulationStep;
  title: string;
  description: string;
  leciGuidance: string;
  systemAction: string;
  nextStep: SimulationStep | null;
}

export const STEP_DEFINITIONS: Record<SimulationStep, StepDefinition> = {
  LISTING: {
    id: "LISTING",
    title: "1. Propriété & Intention",
    description: "L'utilisateur parcourt une annonce et décide de soumettre une offre.",
    leciGuidance: "C'est un excellent choix. Je vais vous guider à travers les formulaires officiels de l'OACIQ pour structurer votre offre de manière conforme.",
    systemAction: "Chargement du moteur Turbo Draft...",
    nextStep: "DRAFTING"
  },
  DRAFTING: {
    id: "DRAFTING",
    title: "2. Rédaction Turbo Form",
    description: "Saisie des informations : prix, dates, et conditions de financement.",
    leciGuidance: "Assurez-vous que le montant du financement correspond bien à votre pré-approbation bancaire. C'est une condition critique.",
    systemAction: "Validation des champs en temps réel...",
    nextStep: "RISK_SITUATION"
  },
  RISK_SITUATION: {
    id: "RISK_SITUATION",
    title: "3. Gestion des Risques",
    description: "L'utilisateur choisit d'exclure la garantie légale.",
    leciGuidance: "Attention : l'exclusion de garantie légale signifie que vous achetez l'immeuble à vos risques et périls. En cas de vice caché, vos recours seront très limités.",
    systemAction: "DÉTECTION DE RISQUE CRITIQUE : Notice d'exclusion requise.",
    nextStep: "USER_QUESTION"
  },
  USER_QUESTION: {
    id: "USER_QUESTION",
    title: "4. Question de l'Utilisateur",
    description: "L'utilisateur demande : 'Est-ce que c'est correct ?'",
    leciGuidance: "Je peux valider que la structure de votre offre respecte les formulaires standards, mais seul un courtier ou un professionnel peut confirmer si ces termes sont optimaux pour votre situation spécifique.",
    systemAction: "Analyse de la réponse LECI... Escalade détectée.",
    nextStep: "AI_REVIEW"
  },
  AI_REVIEW: {
    id: "AI_REVIEW",
    title: "5. Revue AI & Corrections",
    description: "Le système analyse le brouillon pour détecter les erreurs.",
    leciGuidance: "L'IA a détecté une ambiguïté dans la clause 10.2. Je vous suggère de préciser la date limite pour éviter toute confusion juridique.",
    systemAction: "Scan de conformité terminé. 3 points d'amélioration identifiés.",
    nextStep: "COMPLIANCE_SCORE"
  },
  COMPLIANCE_SCORE: {
    id: "COMPLIANCE_SCORE",
    title: "6. Score de Conformité",
    description: "Le score passe de 45% à 85% après corrections.",
    leciGuidance: "Bravo ! Votre score de conformité est maintenant de 85%. Cela indique que votre offre est bien structurée et que les risques majeurs sont adressés.",
    systemAction: "Mise à jour du score : 85%.",
    nextStep: "PROTECTION_MODE"
  },
  PROTECTION_MODE: {
    id: "PROTECTION_MODE",
    title: "7. Mode Protection",
    description: "Le système détecte que l'utilisateur n'est pas représenté.",
    leciGuidance: "Comme vous n'avez pas de courtier, le système active le mode Protection. Il est fortement recommandé de faire réviser cette offre par un professionnel avant signature.",
    systemAction: "Activation du bandeau 'Utilisateur non représenté'.",
    nextStep: "PAYMENT"
  },
  PAYMENT: {
    id: "PAYMENT",
    title: "8. Paiement & Finalisation",
    description: "Paiement de 15$ pour débloquer l'export et la signature.",
    leciGuidance: "Le paiement permet de générer le document final certifié et d'activer le suivi d'intégrité SHA-256.",
    systemAction: "Redirection vers Stripe... Paiement confirmé.",
    nextStep: "SIGNATURE_GATE"
  },
  SIGNATURE_GATE: {
    id: "SIGNATURE_GATE",
    title: "9. Barrière de Signature",
    description: "Le système vérifie toutes les conditions avant de permettre la signature.",
    leciGuidance: "Avant de signer, vous devez confirmer avoir lu la notice sur l'exclusion de garantie. C'est une étape de sécurité obligatoire.",
    systemAction: "Vérification : Notices [OK], Score [OK], Champs [OK].",
    nextStep: "SUCCESS"
  },
  SUCCESS: {
    id: "SUCCESS",
    title: "10. Succès & Signature",
    description: "Signature apposée. PDF généré avec hash d'intégrité.",
    leciGuidance: "Félicitations ! Votre offre est signée et protégée. Le document est maintenant disponible dans votre tableau de bord.",
    systemAction: "Génération du PDF... Hash : SHA-256:8f4a... [GÉNÉRÉ]",
    nextStep: "AUDIT_TRAIL"
  },
  AUDIT_TRAIL: {
    id: "AUDIT_TRAIL",
    title: "11. Piste de Vérification",
    description: "Examen des logs forensic de la transaction.",
    leciGuidance: "Chaque interaction, de la première modification au paiement final, est enregistrée pour votre protection et celle du régulateur.",
    systemAction: "Piste d'audit verrouillée et immuable.",
    nextStep: null
  }
};
