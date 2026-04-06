import { interpolateMessage } from "@/lib/i18n/interpolate";
import { MESSAGES } from "@/lib/i18n/messages";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

export function normalizeLocaleCode(raw: string | null | undefined): LocaleCode {
  return isLocaleCode(raw) ? raw : "en";
}

/** Server-side copy for emails, push, AI surfaces — same dictionary as the client. */
export function translateServer(
  locale: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const code = normalizeLocaleCode(locale ?? undefined);
  const raw = MESSAGES[code]?.[key] ?? MESSAGES.en[key] ?? key;
  return interpolateMessage(raw, vars);
}
