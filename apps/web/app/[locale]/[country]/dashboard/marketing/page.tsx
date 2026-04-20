import Link from "next/link";
import { MarketingPanelClient } from "./marketing-panel-client";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function DashboardMarketingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const studioHref = `/${locale}/${country}/dashboard/marketing-studio`;
  const seoHref = `/${locale}/${country}/dashboard/marketing/seo`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generate ad copy and export — LECIPM Growth + Ads System. Copy is deterministic (no fake “AI” claims).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={seoHref}
            className="shrink-0 rounded-lg border border-sky-600/50 bg-sky-950/40 px-3 py-2 text-sm text-sky-200 hover:border-sky-500 hover:bg-sky-950/60"
          >
            SEO Engine →
          </Link>
          {engineFlags.marketingStudioV1 ? (
            <Link
              href={studioHref}
              className="shrink-0 rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:bg-emerald-950/60"
            >
              Marketing Studio (visual editor) →
            </Link>
          ) : null}
        </div>
      </div>
      <MarketingPanelClient />
    </div>
  );
}
