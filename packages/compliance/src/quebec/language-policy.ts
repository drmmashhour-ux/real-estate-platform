/** Québec public-language posture — product policy (not legal advice). */

export type SupportedLanguageCode = "FR" | "EN";

export type LanguagePolicy = {
  defaultLanguage: SupportedLanguageCode;
  supportedLanguages: SupportedLanguageCode[];
  /** When true, marketplace / marketing surfaces require a substantive French version. */
  requireFrenchForPublicContent: boolean;
  /** When true, broker flows may call LLM / automation for FR companion text. */
  autoTranslateEnabled: boolean;
  /** Legal / regulatory artefacts default to French-first generation. */
  legalDocumentsFrenchPrimary: boolean;
};

export const DEFAULT_QUEBEC_LANGUAGE_POLICY: LanguagePolicy = {
  defaultLanguage: "FR",
  supportedLanguages: ["FR", "EN"],
  requireFrenchForPublicContent: true,
  autoTranslateEnabled: true,
  legalDocumentsFrenchPrimary: true,
};

export const QUEBEC_DEFAULT_UI_LOCALE_HINT = "fr" as const;
