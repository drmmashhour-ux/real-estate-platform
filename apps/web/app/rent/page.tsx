import Link from "next/link";
import type { Metadata } from "next";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { MvpNav } from "@/components/investment/MvpNav";
import { HUB_DASHBOARDS } from "@/lib/hubs/nav";
import { GROWTH_CITY_SLUGS } from "@/lib/growth/geo-slugs";
import { RentHubBrowse } from "./rent-hub-browse";
import { LongTermRentBrowse } from "./long-term-rent-browse";

export const metadata: Metadata = {
  title: `Rent Hub — Long-term & short-term | ${PLATFORM_CARREFOUR_NAME}`,
  description:
    "Long-term rentals with applications, leases, and rent tracking — plus short-term stays on BNHub.",
};

const GOLD = "var(--color-premium-gold)";

export default function RentHubPage() {
  const sampleCity = GROWTH_CITY_SLUGS[0];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Rent Hub
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Long-term &amp; short-term rentals</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#B3B3B3]">
              We support both short-term and long-term rentals with structured workflows, contracts, and payment tracking.
              Browse long-term listings below, or jump into BNHub for nightly stays.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#long-term"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0B0B0B]"
                style={{ background: GOLD }}
              >
                Long-term search
              </a>
              <Link
                href="/search/bnhub"
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                Short-term stays (BNHub)
              </Link>
              <Link
                href={`/rent/${sampleCity}`}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                City guide ({sampleCity})
              </Link>
            </div>
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-sm text-[#B3B3B3]">
              <p className="font-medium text-slate-200">Dashboards</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/dashboard/tenant/payments" className="text-premium-gold hover:underline">
                    Tenant — applications &amp; rent
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/landlord" className="text-premium-gold hover:underline">
                    Landlord — listings &amp; applications
                  </Link>
                </li>
                <li>
                  <Link href={HUB_DASHBOARDS.bnhubHost} className="text-premium-gold hover:underline">
                    BNHub host dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div id="long-term">
          <LongTermRentBrowse />
        </div>

        <section className="border-t border-white/10 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-lg font-bold text-white">Short-term marketplace (BNHub)</h2>
            <p className="mt-1 text-sm text-[#888]">Nightly stays — same platform account, different booking flow.</p>
            <div className="mt-8">
              <RentHubBrowse />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
