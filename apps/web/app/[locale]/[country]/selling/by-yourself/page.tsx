import type { Metadata } from "next";
import { SellByYourselfLandingClient } from "./sell-by-yourself-landing-client";
import { PLATFORM_NAME } from "@/config/branding";
import { getFsboPremiumPublishPriceCents, getFsboPublishPriceCents } from "@/lib/fsbo/constants";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { sellerPlans } from "@/lib/pricing/public-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Prestige Direct — Sell by yourself | ${seoConfig.siteName}`,
    description: `Prestige Direct: owner-led FSBO listings on ${PLATFORM_NAME} — publish packages in CAD, seller subscriptions, tools, and commission comparison.`,
    path: "/selling/by-yourself",
    locale,
    country,
  });
}

export default function SellingByYourselfPage() {
  const basicPublishCad = getFsboPublishPriceCents() / 100;
  const premiumPublishCad = getFsboPremiumPublishPriceCents() / 100;
  const standardSeller = sellerPlans.find((p) => p.id === "standard");
  const suiteMonthlyUsd = standardSeller?.monthlyUsd ?? 99;

  return (
    <SellByYourselfLandingClient
      basicPublishCad={basicPublishCad}
      premiumPublishCad={premiumPublishCad}
      suiteMonthlyUsd={suiteMonthlyUsd}
    />
  );
}
