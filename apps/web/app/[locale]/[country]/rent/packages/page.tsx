import type { Metadata } from "next";
import { MvpNav } from "@/components/investment/MvpNav";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { RentPackagesClient } from "./rent-packages-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Prestige Direct Rentals — Packages | ${seoConfig.siteName}`,
    description: `Rental listing packages for Québec landlords on ${PLATFORM_CARREFOUR_NAME} — Free, Sign, and Showcase tiers in Prestige gold styling. Short-term stays on BNHUB.`,
    path: "/rent/packages",
    locale,
    country,
  });
}

export default function RentPackagesPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <RentPackagesClient />
    </div>
  );
}
