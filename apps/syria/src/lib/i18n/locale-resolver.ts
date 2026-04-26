/**
 * Resolves Darlink locale from Next.js search params + cookies (best-effort, no throws).
 */
import { DARLINK_DEFAULT_LOCALE, DARLINK_LOCALE_COOKIE, SYRIA_I18N_CONFIG } from "./config";
import { normalizeLocale, normalizeSyriaLocale } from "./helpers";
import type { DarlinkLocale, SyriaLocale } from "./types";

export type LocaleResolverInput = {
  pathnameLocale?: string | null;
  cookieHeader?: string | null;
  searchParams?: Record<string, string | string[] | undefined>;
};

function readCookieLocale(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader || typeof cookieHeader !== "string") return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${DARLINK_LOCALE_COOKIE}=`)) {
      return decodeURIComponent(p.slice(DARLINK_LOCALE_COOKIE.length + 1));
    }
  }
  return null;
}

export function resolveDarlinkLocale(input: LocaleResolverInput): DarlinkLocale {
  const fromPath = input.pathnameLocale?.trim();
  if (fromPath) return normalizeLocale(fromPath);

  const q = input.searchParams?.locale ?? input.searchParams?.lang;
  const fromQuery = Array.isArray(q) ? q[0] : q;
  if (fromQuery) return normalizeLocale(fromQuery);

  const fromCookie = readCookieLocale(input.cookieHeader ?? null);
  if (fromCookie) return normalizeLocale(fromCookie);

  return DARLINK_DEFAULT_LOCALE;
}

/** Explicit Syria locale resolver (same precedence as Darlink resolver). */
export function resolveSyriaLocale(input: LocaleResolverInput): SyriaLocale {
  const resolved = resolveDarlinkLocale(input);
  return normalizeSyriaLocale(resolved ?? SYRIA_I18N_CONFIG.defaultLocale);
}
