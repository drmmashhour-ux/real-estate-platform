/**
 * Preferred French labels for Québec residential brokerage artefacts (reference copy).
 * Drafting pipelines should treat French as the binding legal surface; English as optional reference.
 */
export const LECIPM_QUEBEC_BINDING_LOCALE = "fr-CA" as const;

export const QC_RESIDENTIAL_CONTRACT_TERMS_FR = {
  purchaseOffer: "promesse d'achat",
  sellerDeclaration: "déclaration du vendeur",
  inspectionConditions: "conditions d'inspection",
  closing: "signature chez le notaire",
  listing: "propriété à vendre",
  brokerResidential: "courtier immobilier résidentiel",
} as const;
