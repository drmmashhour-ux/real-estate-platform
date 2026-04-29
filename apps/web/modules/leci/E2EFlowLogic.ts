import type { ValidationStatus } from "./responseValidator";

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

export type StepDefinition = {
  id: SimulationStep;
  title: string;
  description: string;
  leciGuidance: string;
  systemAction: string;
  nextStep?: SimulationStep;
};

export const STEP_DEFINITIONS: Record<SimulationStep, StepDefinition> = {
  LISTING: {
    id: "LISTING",
    title: "Discovery",
    description: "Locate the property sheet and disclosures.",
    leciGuidance:
      "Bonjour — je vérifie l’étiquette prix, taxes et exclusions apparentes avant toute décision.",
    systemAction: "Listing context loaded · disclosure pack pending",
    nextStep: "DRAFTING",
  },
  DRAFTING: {
    id: "DRAFTING",
    title: "Draft safeguards",
    description: "Prepare conditional wording for the promise to purchase.",
    leciGuidance:
      "J’aligne vos conditions (inspection, financement, vente concurrente) sur le bon formulaire régional.",
    systemAction: "Draft merged with brokerage templates v12",
    nextStep: "RISK_SITUATION",
  },
  RISK_SITUATION: {
    id: "RISK_SITUATION",
    title: "Risk escalation",
    description: "Flag material risks for human review.",
    leciGuidance:
      "Le vendeur propose une exclusion de garantie importante — vérifiez avec un professionnel avant d’assumer.",
    systemAction: "Critical clause highlighted · playbook PR-042",
    nextStep: "USER_QUESTION",
  },
  USER_QUESTION: {
    id: "USER_QUESTION",
    title: "Clarifications",
    description: "Capture outstanding buyer questions.",
    leciGuidance:
      "Posez vos questions en langage naturel ; je les route vers les champs réglementaires requis.",
    systemAction: "Questionnaire deltas synchronized",
    nextStep: "AI_REVIEW",
  },
  AI_REVIEW: {
    id: "AI_REVIEW",
    title: "AI review lane",
    description: "Internal policy checks.",
    leciGuidance: "Synthèse : risques mitigés, pièces manquantes listées ci-dessous pour signature.",
    systemAction: "Policy engine scan complete",
    nextStep: "COMPLIANCE_SCORE",
  },
  COMPLIANCE_SCORE: {
    id: "COMPLIANCE_SCORE",
    title: "Compliance score",
    description: "Composite signal for go / no-go.",
    leciGuidance: "Votre dossier atteint le seuil interne pour poursuivre — gardez les preuves à jour.",
    systemAction: "Compliance score refreshed",
    nextStep: "PROTECTION_MODE",
  },
  PROTECTION_MODE: {
    id: "PROTECTION_MODE",
    title: "Protection mode",
    description: "Guardrails for high-stakes actions.",
    leciGuidance:
      "Mode protection actif : aucun paiement ni signature tant que les garde-fous ne sont pas verts.",
    systemAction: "Protection matrix engaged",
    nextStep: "PAYMENT",
  },
  PAYMENT: {
    id: "PAYMENT",
    title: "Payment",
    description: "Escrow / deposit handling (lab).",
    leciGuidance: "Référencez toujours le mandat officiel avant de transférer des fonds.",
    systemAction: "Deposit intent recorded (sandbox)",
    nextStep: "SIGNATURE_GATE",
  },
  SIGNATURE_GATE: {
    id: "SIGNATURE_GATE",
    title: "Signature gate",
    description: "Final gate before juridically binding flows.",
    leciGuidance: "Signatures conditionnelles vérouillées tant que checklist KYC incomplets.",
    systemAction: "Signature eligibility evaluated",
    nextStep: "SUCCESS",
  },
  SUCCESS: {
    id: "SUCCESS",
    title: "Success",
    description: "Post-signature confirmations.",
    leciGuidance: "Résumé envoyé aux parties avec horodatage et copie conseillée pour dossier.",
    systemAction: "Artifact bundle finalized",
    nextStep: "AUDIT_TRAIL",
  },
  AUDIT_TRAIL: {
    id: "AUDIT_TRAIL",
    title: "Audit trail",
    description: "Forensic recap for auditors.",
    leciGuidance: "Journal d’audit fermé avec empreinte de chaîne (démo).",
    systemAction: "Audit chain sealed · exports ready",
  },
};

export type LeciMsg = { role: "leci"; content: string; status: ValidationStatus };

export type FlowState = {
  complianceScore: number;
  leciMessages: LeciMsg[];
  systemLogs: { timestamp: string; action: string; type: "INFO" | "CRITICAL" | "WARNING" | "SUCCESS" }[];
  paymentCompleted: boolean;
  currentStep: SimulationStep;
};

export const INITIAL_STATE: FlowState = {
  complianceScore: 48,
  leciMessages: [],
  systemLogs: [],
  paymentCompleted: false,
  currentStep: "LISTING",
};
