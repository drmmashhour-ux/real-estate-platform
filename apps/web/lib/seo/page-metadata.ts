import type { Metadata } from "next";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";
import { stripCountryPrefix, stripLocalePrefix } from "@/i18n/pathname";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export type PageSeoInput = {
  title: string;
  description: string;
  /** App path without locale or country (e.g. `/`, `/listings`). */
  path: string;
  locale?: string;
  /** Lowercase country slug (`ca`, `sy`). */
  country?: string;
  ogImage?: string | null;
  ogImageFallback?: string | null;
  ogImageAlt?: string;
  ogProduct?: { amount: string; currency: string };
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  noindex?: boolean;
};

function resolveOgAbsoluteUrl(
  base: string,
  raw: string | null | undefined
): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `${base}${t.startsWith("/") ? t : `/${t}`}`;
}

/** Builds `/[locale]/[country]/...` when `path` is app-relative. */
function resolveCanonicalPath(path: string, locale: string, country: string): string {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const hasLocalePrefix = (routing.locales as readonly string[]).some(
    (l) => raw === `/${l}` || raw.startsWith(`/${l}/`)
  );
  if (hasLocalePrefix) return raw;
  const app = raw === "/" ? "" : raw;
  return `/${locale}/${country}${app}`;
}

function ogLocaleTag(locale: string, country: string): string {
  if (country === "ca" && locale === "fr") return "fr_CA";
  if (country === "ca" && locale === "en") return "en_CA";
  if (country === "sy" && locale === "ar") return "ar_SY";
  if (locale === "fr") return "fr_CA";
  if (locale === "ar") return "ar_SY";
  return "en_CA";
}

/** Open Graph + Twitter defaults for any route. */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const base = getSiteBaseUrl();
  const locale = input.locale ?? routing.defaultLocale;
  const country = input.country ?? DEFAULT_COUNTRY_SLUG;
  const canonicalPath = resolveCanonicalPath(input.path, locale, country);
  const url = `${base}${canonicalPath}`;
  const ogUrl =
    resolveOgAbsoluteUrl(base, input.ogImage) ??
    resolveOgAbsoluteUrl(base, input.ogImageFallback) ??
    resolveOgAbsoluteUrl(base, OG_DEFAULT_PLATFORM);
  const imageAlt = input.ogImageAlt?.trim() || input.title;

  const productMeta =
    input.ogProduct && input.ogProduct.amount
      ? {
          other: {
            "product:price:amount": input.ogProduct.amount,
            "product:price:currency": input.ogProduct.currency || "CAD",
          } as Record<string, string | number>,
        }
      : {};

  const afterCountry = stripCountryPrefix(stripLocalePrefix(canonicalPath));
  const suffix = afterCountry === "/" ? "" : afterCountry;

  const enCa = `${base}/en/ca${suffix}`;
  const frCa = `${base}/fr/ca${suffix}`;
  const arSy = `${base}/ar/sy${suffix}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url,
      languages: {
        "en-CA": enCa,
        "fr-CA": frCa,
        "ar-SY": arSy,
        "x-default": enCa,
      },
    },
    robots: input.noindex ? { index: false, follow: false } : { index: true, follow: true },
    ...productMeta,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: seoConfig.siteName,
      locale: ogLocaleTag(locale, country),
      type: input.type ?? "website",
      ...(input.publishedTime && input.type === "article" ? { publishedTime: input.publishedTime } : {}),
      images: ogUrl
        ? [
            {
              url: ogUrl,
              width: 1200,
              height: 630,
              alt: imageAlt,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(ogUrl ? { images: [ogUrl] } : {}),
    },
  };
}
