import type { Metadata } from "next";
import { seoConfig } from "@/lib/seo/config";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  /** Absolute or site-root path (e.g. /og.png) */
  ogImage?: string | null;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  noindex?: boolean;
};

/** Canonical Open Graph + Twitter defaults for any route. */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const base = getSiteBaseUrl();
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = `${base}${canonicalPath}`;
  const ogUrl =
    input.ogImage && (input.ogImage.startsWith("http://") || input.ogImage.startsWith("https://"))
      ? input.ogImage
      : input.ogImage
        ? `${base}${input.ogImage.startsWith("/") ? input.ogImage : `/${input.ogImage}`}`
        : undefined;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: seoConfig.siteName,
      type: input.type ?? "website",
      ...(input.publishedTime && input.type === "article" ? { publishedTime: input.publishedTime } : {}),
      ...(ogUrl ? { images: [{ url: ogUrl }] } : {}),
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(ogUrl ? { images: [ogUrl] } : {}),
    },
  };
}
