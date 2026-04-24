/** User-facing consent for in-platform electronic signature (bilingual Québec context). */
export const DIGITAL_SIGN_CONSENT_TEXT_EN =
  "I agree to sign this document electronically and understand it is legally binding.";

export const DIGITAL_SIGN_CONSENT_TEXT_FR =
  "J’accepte de signer ce document électroniquement et je comprends qu’il a force obligatoire.";

export const DIGITAL_SIGN_CONSENT_TEXT_VERSION = "v1_qc_esig_2026";

export function consentTextsForDisplay(): { en: string; fr: string; version: string } {
  return {
    en: DIGITAL_SIGN_CONSENT_TEXT_EN,
    fr: DIGITAL_SIGN_CONSENT_TEXT_FR,
    version: DIGITAL_SIGN_CONSENT_TEXT_VERSION,
  };
}
