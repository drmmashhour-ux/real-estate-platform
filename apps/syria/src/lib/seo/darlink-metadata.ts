import type { Metadata } from "next";
import { darlinkBrand } from "@/lib/brand/darlink-brand";
import type { DarlinkLocale } from "@/lib/i18n/types";

function appUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SYRIA_APP_URL ?? "http://localhost:3002";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3002");
  }
}

export function darlinkMetadataBase(): Metadata {
  return {
    metadataBase: appUrl(),
    icons: {
      icon: [
        { url: "/hadiah-favicon.svg", type: "image/svg+xml" },
        { url: darlinkBrand.icon48, sizes: "48x48", type: "image/png" },
        { url: darlinkBrand.icon192, sizes: "192x192", type: "image/png" },
        { url: darlinkBrand.icon512, sizes: "512x512", type: "image/png" },
        { url: darlinkBrand.faviconIco, type: "image/x-icon" },
        { url: darlinkBrand.favicon16, sizes: "16x16", type: "image/png" },
        { url: darlinkBrand.favicon32, sizes: "32x32", type: "image/png" },
      ],
      shortcut: darlinkBrand.faviconIco,
      apple: [{ url: darlinkBrand.appleTouchIcon, sizes: "180x180", type: "image/png" }],
    },
  };
}

/**
 * Canonical URL uses locale prefix routes: `/{locale}{pathname}` where pathname starts with `/`.
 */
export function buildDarlinkPageMetadata(opts: {
  locale: DarlinkLocale;
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  const pathSeg = opts.pathname.startsWith("/") ? opts.pathname : `/${opts.pathname}`;
  const canonicalPath = `/${opts.locale}${pathSeg === "//" ? "/" : pathSeg}`.replace(/\/+/g, "/");
  const canonicalUrl = new URL(canonicalPath, appUrl()).toString();

  const ogLocale = opts.locale === "ar" ? "ar_SY" : "en_US";

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonicalUrl,
      siteName: darlinkBrand.englishName,
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: darlinkBrand.ogDefaultImage,
          width: 1200,
          height: 630,
          alt: opts.locale === "ar" ? darlinkBrand.arabicName : darlinkBrand.englishName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [darlinkBrand.ogDefaultImage],
    },
  };
}
