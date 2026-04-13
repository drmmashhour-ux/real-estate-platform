import type { Metadata } from "next";
import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { ForBrokersClient } from "./for-brokers-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    path: "/mortgage/for-brokers",
    locale,
    country,
    title: `Mortgage broker partners | ${seoConfig.siteName}`,
    description:
      "Join the LECIPM mortgage broker platform — free program preview or paid tiers with lead routing, dashboard, and client contact tools.",
  });
}

export default function MortgageForBrokersPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <div className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/mortgage" className="text-sm text-[#9CA3AF] hover:text-white">
            ← Mortgage hub
          </Link>
          <Link
            href="/auth/signup-expert"
            className="text-sm font-semibold text-premium-gold hover:underline"
          >
            Expert signup
          </Link>
        </div>
      </div>
      <ForBrokersClient />
    </div>
  );
}
