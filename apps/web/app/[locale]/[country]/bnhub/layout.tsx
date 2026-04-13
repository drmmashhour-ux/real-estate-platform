import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BNHUB_MARK_SRC } from "@/lib/brand/bnhub-logo";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return {
    ...buildPageMetadata({
      title: `BNHUB — Short-term stays | ${seoConfig.siteName}`,
      description: `Book verified short-term rentals on BNHUB — nightly rates, map search, guest protections, and secure checkout on ${seoConfig.siteName}.`,
      path: "/bnhub",
      locale,
      country,
      ogImage: OG_DEFAULT_BNHUB,
      ogImageAlt: "BNHUB — short-term stays on LECIPM",
    }),
    icons: {
      icon: [{ url: BNHUB_MARK_SRC, type: "image/png" }],
      apple: [{ url: BNHUB_MARK_SRC, sizes: "180x180", type: "image/png" }],
    },
  };
}

/** BNHUB guest/host surfaces — tab icon + default Open Graph for all `/bnhub/*` routes (pages may override). */
export default function BnHubSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
