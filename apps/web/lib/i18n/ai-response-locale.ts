import type { LocaleCode } from "@/lib/i18n/locales";

/**
 * Non-user-visible system appendix for LLM prompts — keeps replies aligned with UI language.
 * Internal instructions only (not rendered in the UI).
 */
export function buildAiSystemLanguageAppendix(locale: LocaleCode): string {
  switch (locale) {
    case "fr":
      return "LANGUE_UTILISATEUR: français canadien. Rédigez tout le texte destiné à l’utilisateur (réponses, résumés, recommandations) en français professionnel et clair. Les identifiants techniques et les clés système peuvent rester en anglais.";
    case "ar":
      return "USER_LANGUAGE: Arabic (Modern Standard Arabic for user-visible prose). Write summaries, recommendations, and explanations shown to the user in clear Arabic. Technical IDs may stay in Latin script.";
    case "en":
    default:
      return "USER_LANGUAGE: English. Write all user-visible text (answers, summaries, recommendations) in clear professional English.";
  }
}

/** BCP 47 tag for Intl formatters from UI locale code. */
export function bcp47ForUiLocale(locale: LocaleCode): string {
  switch (locale) {
    case "fr":
      return "fr-CA";
    case "ar":
      return "ar";
    case "en":
    default:
      return "en-CA";
  }
}
