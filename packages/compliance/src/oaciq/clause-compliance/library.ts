import type { ClauseLibraryEntry } from "@/lib/compliance/oaciq/clause-compliance/types";

const CORE: Array<"action" | "actor" | "deadline" | "notice" | "consequence"> = [
  "action",
  "actor",
  "deadline",
  "notice",
  "consequence",
];

export const OACIQ_CLAUSE_LIBRARY: readonly ClauseLibraryEntry[] = [
  {
    id: "brokerage_reduced_compensation",
    category: "brokerage_contract",
    labelFr: "Rémunération réduite",
    labelEn: "Reduced compensation",
    templateFr:
      "{{actor}} s'engage à {{action}}. Délai : {{deadline}}. Avis : {{notice}}. Sanction / effet : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "brokerage_warranty_exclusion",
    category: "brokerage_contract",
    labelFr: "Exclusion de garantie",
    labelEn: "Warranty exclusion",
    templateFr:
      "{{actor}} exclut expressément {{action}}. Échéance des obligations : {{deadline}}. Modalités d'avis : {{notice}}. Conséquence : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "brokerage_legal_warranty_limitation",
    category: "brokerage_contract",
    labelFr: "Limitation de garantie légale",
    labelEn: "Legal warranty limitation",
    templateFr:
      "{{actor}} limite la portée de {{action}}. Délai : {{deadline}}. Avis : {{notice}}. Recours / conséquence : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "brokerage_designated_buyer_exclusion",
    category: "brokerage_contract",
    labelFr: "Exclusion d'acheteur désigné",
    labelEn: "Designated buyer exclusion",
    templateFr:
      "{{actor}} exclut la négociation avec {{action}}. Jusqu'au : {{deadline}}. Avis requis : {{notice}}. Effet : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "brokerage_termination_notice",
    category: "brokerage_contract",
    labelFr: "Avis de résiliation",
    labelEn: "Notice of termination",
    templateFr:
      "{{actor}} peut résilier moyennant {{action}}. Préavis / délai : {{deadline}}. Forme d'avis : {{notice}}. Effets résolutoires : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "brokerage_dual_representation_warning",
    category: "brokerage_contract",
    labelFr: "Avertissement — double représentation",
    labelEn: "Double representation warning",
    templateFr:
      "{{actor}} reconnaît {{action}}. Échéance d'information : {{deadline}}. Divulgation / avis : {{notice}}. Conséquences en cas de défaut : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: ["dual_representation_warning"],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "amendment_off_market",
    category: "amendment",
    labelFr: "Avenant — inscription hors marché",
    labelEn: "Amendment — off-market",
    templateFr:
      "{{actor}} mandate {{action}}. Entrée en vigueur : {{deadline}}. Avis aux parties : {{notice}}. Effet sur le contrat : {{consequence}}.",
    requiredParams: CORE,
    optionalParams: ["listingReference"],
    complianceFlags: ["off_market"],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_earnest_money",
    category: "promise_to_purchase",
    labelFr: "Dépôt de bonne foi / acompte",
    labelEn: "Earnest money",
    templateFr:
      "{{actor}} verse ou dépose {{action}} au plus tard le {{deadline}}. Confirmation : {{notice}}. En cas de défaut : {{consequence}}.",
    requiredParams: CORE,
    optionalParams: ["amount", "trustAccountRef"],
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_inspection_condition",
    category: "promise_to_purchase",
    labelFr: "Condition d'inspection",
    labelEn: "Inspection condition",
    templateFr:
      "{{actor}} doit {{action}} avant le {{deadline}}. Modalités d'avis : {{notice}}. Effet résolutoire / recours : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_insurance_requirement",
    category: "promise_to_purchase",
    labelFr: "Exigence d'assurance",
    labelEn: "Insurance requirement",
    templateFr:
      "{{actor}} fournit {{action}} pour la date du {{deadline}}. Preuve / avis : {{notice}}. Non-conformité : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_zoning_verification",
    category: "promise_to_purchase",
    labelFr: "Vérification de zonage",
    labelEn: "Zoning verification",
    templateFr:
      "{{actor}} valide {{action}} avant le {{deadline}}. Transmission des constats : {{notice}}. Si défavorable : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_certificate_location",
    category: "promise_to_purchase",
    labelFr: "Certificat de localisation",
    labelEn: "Certificate of location",
    templateFr:
      "{{actor}} obtient ou accepte {{action}} échéant le {{deadline}}. Remise / avis : {{notice}}. Sinon : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_buyer_visit_rights",
    category: "promise_to_purchase",
    labelFr: "Droits de visite de l'acheteur",
    labelEn: "Buyer visit rights",
    templateFr:
      "{{actor}} permet {{action}} selon l'échéancier suivant : {{deadline}}. Coordination / avis : {{notice}}. Manquement : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "promise_acceptance_condition",
    category: "promise_to_purchase",
    labelFr: "Condition d'acceptation",
    labelEn: "Acceptance condition",
    templateFr:
      "{{actor}} est lié si {{action}} est satisfaite au plus tard le {{deadline}}. Preuve : {{notice}}. Sinon : {{consequence}}.",
    requiredParams: CORE,
    complianceFlags: [],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "other_security_deposit_trust",
    category: "other_clauses",
    labelFr: "Dépôt de garantie — compte en fidéicommis",
    labelEn: "Security deposit — trust account",
    templateFr:
      "Le fiduciaire {{actor}} détient {{action}} jusqu'au {{deadline}}. Avis de libération : {{notice}}. Conditions de restitution / retenue : {{consequence}}.",
    requiredParams: CORE,
    optionalParams: ["trusteeName", "trustAccountId"],
    complianceFlags: ["security_deposit_trust"],
    version: "2022-forms-ref",
    active: true,
  },
  {
    id: "enterprise_asset_definition",
    category: "enterprise_sale",
    labelFr: "Cession d'entreprise — périmètre d'actifs",
    labelEn: "Enterprise sale — asset scope",
    templateFr:
      "{{actor}} définit l'actif comme suit : {{action}}. Clôture cible : {{deadline}}. Due diligence / avis : {{notice}}. Non-conformité : {{consequence}}.",
    requiredParams: CORE,
    optionalParams: ["immovableIncluded"],
    complianceFlags: ["enterprise_combined_transaction"],
    version: "2022-forms-ref",
    active: true,
  },
] as const;

const BY_ID = new Map(OACIQ_CLAUSE_LIBRARY.map((e) => [e.id, e]));

export function getClauseLibraryEntry(id: string): ClauseLibraryEntry | undefined {
  return BY_ID.get(id);
}

export function listActiveClausesByCategory(category: ClauseLibraryEntry["category"]): ClauseLibraryEntry[] {
  return OACIQ_CLAUSE_LIBRARY.filter((c) => c.active && c.category === category);
}
