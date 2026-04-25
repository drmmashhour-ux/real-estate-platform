export type { LanguagePolicy, SupportedLanguageCode } from "@/lib/compliance/quebec/language-policy";
export {
  DEFAULT_QUEBEC_LANGUAGE_POLICY,
  QUEBEC_DEFAULT_UI_LOCALE_HINT,
} from "@/lib/compliance/quebec/language-policy";
export {
  LECIPM_QUEBEC_BINDING_LOCALE,
  QC_RESIDENTIAL_CONTRACT_TERMS_FR,
} from "@/lib/compliance/quebec/contract-language-defaults";
export type { BrokerLicenceAttestationInput } from "@/lib/compliance/quebec/broker-residential-attestation";
export {
  RESIDENTIAL_BROKER_TITLE_FR,
  assertResidentialLicenceType,
  formatBilingualEmailFooter,
  formatResidentialBrokerSignatureBlock,
  scanResidentialScopeViolations,
} from "@/lib/compliance/quebec/broker-residential-attestation";
export type { BilingualContent } from "@/lib/compliance/quebec/bilingual-content.service";
export { generateBilingualContent } from "@/lib/compliance/quebec/bilingual-content.service";
export type { MessageLanguageGuess } from "@/lib/compliance/quebec/translation-engine";
export {
  applyQuebecRealEstateGlossaryEnToFr,
  detectMessageLanguage,
  translateEnToFrQuebecProfessional,
  translateFrToEnReference,
} from "@/lib/compliance/quebec/translation-engine";
export type { QuebecLanguageViolation, ListingPublicLanguageInput } from "@/lib/compliance/quebec/language-compliance.guard";
export {
  FRENCH_VERSION_REQUIRED_MESSAGE,
  validateFrenchPublicListingContent,
  validateResidentialScopeForPublish,
} from "@/lib/compliance/quebec/language-compliance.guard";
export type { QuebecListingPublishEvaluation } from "@/lib/compliance/quebec/listing-quebec-compliance-publish.service";
export { validateQuebecLanguageForListingPublish } from "@/lib/compliance/quebec/listing-quebec-compliance-publish.service";
export type { QuebecMessageMetadata } from "@/lib/compliance/quebec/chat-bilingual-metadata";
export { buildBrokerMessageQuebecMetadata } from "@/lib/compliance/quebec/chat-bilingual-metadata";
