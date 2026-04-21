import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioAssetDetailClient } from "@/components/portfolio/portfolio-asset-detail-client";

export const metadata: Metadata = {
  title: "Asset · Portfolio intelligence · LECIPM",
};

export default async function PortfolioAssetPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; assetId: string }>;
}) {
  const { locale, country, assetId } = await params;
  const prefix = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`${prefix}/dashboard/portfolio`} className="text-primary underline-offset-4 hover:underline">
          ← Portfolio hub
        </Link>
        <Link href={`${prefix}/dashboard/portfolio/intelligence`} className="text-primary underline-offset-4 hover:underline">
          Optimization runs
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Asset workspace</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{assetId}</p>
      </div>
      <PortfolioAssetDetailClient assetId={assetId} />
    </div>
  );
}
