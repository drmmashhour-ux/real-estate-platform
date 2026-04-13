import type { Metadata } from "next";
import { ExploreQuebecClient } from "./explore-quebec-client";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { PLATFORM_IMMOBILIER_HUB_NAME } from "@/lib/brand/platform";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `${PLATFORM_IMMOBILIER_HUB_NAME} — Explore Québec | ${seoConfig.siteName}`,
    description:
      `${PLATFORM_IMMOBILIER_HUB_NAME}: English-first Québec property search — map, filters, financing tools, and broker resources on LECIPM.`,
    path: "/explore",
    locale,
    country,
  });
}

export default function ExploreQuebecPage() {
  return <ExploreQuebecClient />;
}
