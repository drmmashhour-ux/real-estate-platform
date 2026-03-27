/**
 * OACIQ-style Amendments form – structured schema for storage and PDF generation.
 * All fields map to the official form sections (M1–M7).
 */

export type AmendmentsPayload = {
  // M1 Reference
  principalFormType?: string;
  principalFormOther?: string;
  immovableAddress?: string;

  // M2 Brokerage contract amendments
  brokerageExpiryClause?: string;
  brokerageExpiryDate?: string;
  brokerageSalePriceClause?: string;
  brokerageSalePrice?: string;

  // M3 Extension of acceptance period
  acceptanceClause?: string;
  acceptanceTime?: string;
  acceptanceDate?: string;

  // M4 Extension of time period
  timePeriodClause?: string;
  extendedDate?: string;

  // M5 Other amendments
  otherAmendments?: string;

  // M6 Other conditions confirmed
  otherConditionsConfirmed?: boolean;

  // M7 Signatures – Buyer
  buyerAgencyRole?: string;
  buyerSignedCity1?: string;
  buyerSignedDate1?: string;
  buyerSignedTime1?: string;
  buyerSignature1?: string;
  buyerWitness1?: string;
  buyerSignedCity2?: string;
  buyerSignedDate2?: string;
  buyerSignedTime2?: string;
  buyerSignature2?: string;
  buyerWitness2?: string;

  // M7 Signatures – Seller
  sellerAgencyRole?: string;
  sellerSignedCity1?: string;
  sellerSignedDate1?: string;
  sellerSignedTime1?: string;
  sellerSignature1?: string;
  sellerWitness1?: string;
  sellerSignedCity2?: string;
  sellerSignedDate2?: string;
  sellerSignedTime2?: string;
  sellerSignature2?: string;
  sellerWitness2?: string;

  // M7 Signatures – Spouse intervention
  spouseIntervention?: string;
  spouseSignedCity?: string;
  spouseSignedDate?: string;
  spouseSignedTime?: string;
  spouseSignature?: string;
  spouseWitness?: string;
};

export const AMENDMENTS_FORM_TYPE = "amendments";

export const amendmentsDefaultPayload = (): AmendmentsPayload => ({
  principalFormType: "",
  principalFormOther: "",
  immovableAddress: "",
  brokerageExpiryClause: "",
  brokerageExpiryDate: "",
  brokerageSalePriceClause: "",
  brokerageSalePrice: "",
  acceptanceClause: "",
  acceptanceTime: "",
  acceptanceDate: "",
  timePeriodClause: "",
  extendedDate: "",
  otherAmendments: "",
  otherConditionsConfirmed: false,
  buyerAgencyRole: "",
  buyerSignedCity1: "",
  buyerSignedDate1: "",
  buyerSignedTime1: "",
  buyerSignature1: "",
  buyerWitness1: "",
  buyerSignedCity2: "",
  buyerSignedDate2: "",
  buyerSignedTime2: "",
  buyerSignature2: "",
  buyerWitness2: "",
  sellerAgencyRole: "",
  sellerSignedCity1: "",
  sellerSignedDate1: "",
  sellerSignedTime1: "",
  sellerSignature1: "",
  sellerWitness1: "",
  sellerSignedCity2: "",
  sellerSignedDate2: "",
  sellerSignedTime2: "",
  sellerSignature2: "",
  sellerWitness2: "",
  spouseIntervention: "",
  spouseSignedCity: "",
  spouseSignedDate: "",
  spouseSignedTime: "",
  spouseSignature: "",
  spouseWitness: "",
});
