/** Disclosure document kinds stored in `AmfDealDisclosure.docType`. */
export const AMF_DISCLOSURE_RISK = "RISK_DOCUMENT";
export const AMF_DISCLOSURE_OFFERING = "OFFERING_SUMMARY";

export const REQUIRED_SUBSCRIPTION_DISCLOSURES = [AMF_DISCLOSURE_RISK, AMF_DISCLOSURE_OFFERING] as const;

/** `AmfCapitalDeal.solicitationMode` */
export const AMF_SOLICITATION_PRIVATE = "PRIVATE_PLACEMENT";
export const AMF_SOLICITATION_PROSPECTUS_EXEMPT = "PROSPECTUS_EXEMPT";
