import type { EducationTrigger, SoloBrokerEducationModuleId } from "./types";

export type EducationModuleDefinition = {
  id: SoloBrokerEducationModuleId;
  titleFr: string;
  titleEn: string;
  summaryFr: string;
  summaryEn: string;
  triggers: EducationTrigger[];
};

/** §4 Training / coaching — catalogue for in-app education surfaces (not supervision). */
export const SOLO_BROKER_EDUCATION_MODULES: EducationModuleDefinition[] = [
  {
    id: "oaciq_rules_overview",
    titleFr: "Cadre OACIQ",
    titleEn: "OACIQ framework",
    summaryFr: "Principes de conduite et obligations professionnelles.",
    summaryEn: "Professional conduct and obligations.",
    triggers: ["first_use", "annual_refresh"],
  },
  {
    id: "broker_responsibilities",
    titleFr: "Responsabilités du courtier",
    titleEn: "Broker responsibilities",
    summaryFr: "Portée du permis et devoirs envers le public.",
    summaryEn: "Licence scope and duties to the public.",
    triggers: ["first_use", "high_risk_action"],
  },
  {
    id: "legal_obligations_reba",
    titleFr: "Loi sur le courtage immobilier",
    titleEn: "Real Estate Brokerage Act",
    summaryFr: "Cadre légal provincial et documents clés.",
    summaryEn: "Provincial legal framework and key documents.",
    triggers: ["new_feature", "high_risk_action"],
  },
  {
    id: "fraud_prevention",
    titleFr: "Prévention de la fraude",
    titleEn: "Fraud prevention",
    summaryFr: "Signaux d’alerte et bonnes pratiques.",
    summaryEn: "Red flags and safe practices.",
    triggers: ["high_risk_action", "verification_failed"],
  },
  {
    id: "conflict_of_interest",
    titleFr: "Conflits d'intérêts",
    titleEn: "Conflict of interest",
    summaryFr: "Divulgation et gestion des situations à risque.",
    summaryEn: "Disclosure and managing conflict situations.",
    triggers: ["new_feature", "high_risk_action"],
  },
];
