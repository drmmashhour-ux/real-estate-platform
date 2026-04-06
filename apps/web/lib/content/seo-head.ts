import type { Metadata } from "next";
import type { ContentLocale } from "./types";

const LOCALE_TO_OPENGRAPH: Record<ContentLocale, string> = {
  en: "en_CA",
  fr: "fr_CA",
  ar: "ar",
};

export type LocalizedSeoPack = {
  locale: ContentLocale;
  title: string;
  description: string;
  /** Absolute URL preferred for canonical (site root + path). */
  canonicalPath: string;
  /** BCP-47 for Open Graph */
  openGraphLocale?: string;
};

/**
 * Build Next.js `Metadata` for a public route with localized title/description.
 * For hreflang, pass absolute URLs via `metadata.alternates` at the page level when all locale variants are known.
 */
export function buildLocalizedPageMetadata(pack: LocalizedSeoPack): Metadata {
  return {
    title: pack.title,
    description: pack.description,
    alternates: { canonical: pack.canonicalPath },
    openGraph: {
      title: pack.title,
      description: pack.description,
      locale: pack.openGraphLocale ?? LOCALE_TO_OPENGRAPH[pack.locale],
    },
  };
}

export function openGraphLocaleForUi(locale: ContentLocale): string {
  return LOCALE_TO_OPENGRAPH[locale] ?? "en_CA";
}
