/**
 * User-facing bilingual copy — regulatory responsibility remains with the broker.
 */

export const BROKER_RESPONSIBILITY_CRITICAL = {
  fr: "Vous êtes responsable de cette opération conformément aux règles de l'OACIQ.",
  en: "You are responsible for this operation under OACIQ rules.",
} as const;

/** §11 Legal protection — platform does not supervise brokers (solo-broker adaptation). */
export const PLATFORM_LEGAL_NOTICE_SOLO_BROKER = {
  fr: "La plateforme agit comme un outil technologique d'assistance et ne supervise pas les courtiers.",
  en: "The platform acts as a technological tool and does not supervise brokers.",
} as const;

export type SupportedLegalLocale = "fr" | "en";

export function brokerResponsibilityLine(locale: SupportedLegalLocale): string {
  return locale === "fr" ? BROKER_RESPONSIBILITY_CRITICAL.fr : BROKER_RESPONSIBILITY_CRITICAL.en;
}

export function platformLegalNoticeLine(locale: SupportedLegalLocale): string {
  return locale === "fr" ? PLATFORM_LEGAL_NOTICE_SOLO_BROKER.fr : PLATFORM_LEGAL_NOTICE_SOLO_BROKER.en;
}
