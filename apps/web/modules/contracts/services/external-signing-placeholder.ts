/**
 * Future integrations: DocuSign, Adobe Sign, Notarius, etc.
 * Persist `externalProvider` + `externalEnvelopeId` on `Contract` when wired.
 */
export type ExternalSigningProvider = "docusign" | "adobe_sign" | "notarius" | null;

export interface IdentityVerificationPlaceholder {
  /** When true, require verified ID before signing (future). */
  requireVerifiedId: boolean;
  provider: string | null;
}

export const DEFAULT_EXTERNAL_SIGNING: {
  docuSign: { enabled: boolean };
  identityGate: IdentityVerificationPlaceholder;
} = {
  docuSign: { enabled: false },
  identityGate: { requireVerifiedId: false, provider: null },
};
