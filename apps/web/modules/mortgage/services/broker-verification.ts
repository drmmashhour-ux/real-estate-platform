/** License (AMF) + identity (ID/selfie) must both be admin-verified for leads and dashboard. */
export function brokerHasLeadAccess(b: {
  verificationStatus: string;
  identityStatus: string;
}): boolean {
  return b.verificationStatus === "verified" && b.identityStatus === "verified";
}

/** Persisted `isVerified`: true only when both license and identity reviews passed. */
export function computeBrokerIsVerified(b: {
  verificationStatus: string;
  identityStatus: string;
}): boolean {
  return brokerHasLeadAccess(b);
}

export const IDENTITY_MANUAL_REVIEW_DISCLAIMER =
  "Identity verification is reviewed manually to ensure platform trust and compliance.";

export const IDENTITY_LEADS_REQUIRED_WARNING =
  "Identity verification is required to access leads.";
