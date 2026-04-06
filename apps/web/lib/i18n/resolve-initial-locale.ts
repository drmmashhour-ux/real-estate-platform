import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";
import { getResolvedMarket } from "@/lib/markets";

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

/**
 * SSR locale: explicit `mi_locale` cookie wins; otherwise signed-in user's `preferredUiLocale`; else English.
 */
export async function resolveInitialLocale(cookieStore: CookieStore): Promise<LocaleCode> {
  const raw = cookieStore.get(LOCALE_COOKIE)?.value?.trim() ?? "";
  if (raw) {
    const hit = UI_LOCALE_ENTRIES.find((l) => l.code === (raw as LocaleCode));
    if (hit) return hit.code;
  }

  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
  const userId = await resolveSessionTokenToUserId(sessionToken);
  if (userId) {
    const pref = (
      await prisma.user.findUnique({
        where: { id: userId },
        select: { preferredUiLocale: true },
      })
    )?.preferredUiLocale?.trim();
    const fromProfile = UI_LOCALE_ENTRIES.find((l) => l.code === (pref as LocaleCode));
    if (fromProfile) return fromProfile.code;
  }

  const market = await getResolvedMarket();
  const sug = market.suggestedDefaultLocale?.trim().toLowerCase() ?? "";
  if (sug === "ar" || sug === "fr" || sug === "en") {
    const fromMarket = UI_LOCALE_ENTRIES.find((l) => l.code === sug);
    if (fromMarket) return fromMarket.code;
  }

  return "en";
}
