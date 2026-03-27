/** Document slots for Seller Hub (stored in `FsboListingDocument`). */
export const FSBO_HUB_DOC_TYPES = {
  OWNERSHIP: "ownership",
  ID_PROOF: "id_proof",
  TAX_OPTIONAL: "tax_optional",
  CERTIFICATE_OPTIONAL: "certificate_optional",
} as const;

export type FsboHubDocType = (typeof FSBO_HUB_DOC_TYPES)[keyof typeof FSBO_HUB_DOC_TYPES];

export const FSBO_HUB_REQUIRED_DOC_TYPES: FsboHubDocType[] = [
  FSBO_HUB_DOC_TYPES.OWNERSHIP,
  FSBO_HUB_DOC_TYPES.ID_PROOF,
];

export const FSBO_HUB_ALL_DOC_TYPES: FsboHubDocType[] = [
  ...FSBO_HUB_REQUIRED_DOC_TYPES,
  FSBO_HUB_DOC_TYPES.TAX_OPTIONAL,
  FSBO_HUB_DOC_TYPES.CERTIFICATE_OPTIONAL,
];
