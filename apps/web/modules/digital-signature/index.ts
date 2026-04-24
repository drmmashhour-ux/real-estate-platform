export { consentTextsForDisplay, DIGITAL_SIGN_CONSENT_TEXT_EN, DIGITAL_SIGN_CONSENT_TEXT_VERSION } from "./consent-text";
export {
  createDigitalSignatureRecord,
  exportSignatureAuditJson,
  getLockedPdfBytes,
  refreshLockedPdfForArtifact,
} from "./digital-signature.service";
export { assertBrokerDigitalSignatureMatchesDocument, requireDigitalSignatureForLegalDocApproval } from "./broker-approval-gate";
export { canonicalDocumentSha256 } from "./document-hash";
