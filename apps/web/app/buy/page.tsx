import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { MvpNav } from "@/components/investment/MvpNav";
import { HUB_DASHBOARDS } from "@/lib/hubs/nav";
import { GROWTH_CITY_SLUGS } from "@/lib/growth/geo-slugs";
import { ListingsBrowseClient } from "@/components/listings/ListingsBrowseClient";
import { HubAiDock } from "@/components/ai/HubAiDock";

export const metadata: Metadata = {
  title: `BuyHub — Find a home | ${PLATFORM_CARREFOUR_NAME}`,
  description: "Browse listings, estimate payments, and connect with brokers — BuyHub on LECIPM. No login required to search.",
};

const GOLD = "#C9A646";

export default function BuyHubPage() {
  const sampleCity = GROWTH_CITY_SLUGS[0];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              BuyHub
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Buy a home with clarity</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#B3B3B3]">
              Search inventory, explore affordability on every listing, and connect with brokers or mortgage specialists
              when you are ready — all inside {PLATFORM_CARREFOUR_NAME}.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/listings"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0B0B0B]"
                style={{ background: GOLD }}
              >
                Open full listings
              </Link>
              <Link
                href={`/buy/${sampleCity}`}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                City guide ({sampleCity})
              </Link>
              <Link href={HUB_DASHBOARDS.buyer} className="text-sm font-medium text-[#C9A646] hover:underline">
                Buyer dashboard →
              </Link>
              <Link
                href="/dashboard/buyer/inquiries"
                className="text-sm font-medium text-slate-400 hover:text-[#C9A646]"
              >
                Your inquiries →
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
          <HubAiDock hub="buyer" accent={GOLD} context={{ surface: "buy_hub_landing" }} />
        </div>

        <Suspense
          fallback={<div className="py-16 text-center text-sm text-slate-500">Loading search…</div>}
        >
          <ListingsBrowseClient embedded />
        </Suspense>
      </main>
    </div>
  );
}
