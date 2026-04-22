"use client";

import Link from "next/link";

import type { RevenueDashboardData } from "@/modules/dashboard/view-models";
import { formatCadCompactFromCents } from "@/modules/dashboard/services/format-dashboard-currency";

const revenueByHubDemo = [
  { slug: "buyer" as const, hub: "Buyer Hub", amount: "$1,240", delta: "+8.2%" },
  { slug: "seller" as const, hub: "Seller Hub", amount: "$2,880", delta: "+12.5%" },
  { slug: "broker" as const, hub: "Broker Hub", amount: "$3,575", delta: "+6.4%" },
  { slug: "investor" as const, hub: "Investor Hub", amount: "$980", delta: "+3.1%" },
  { slug: "bnhub" as const, hub: "BNHub", amount: "$3,420", delta: "+14.8%" },
  { slug: "rent" as const, hub: "Rent Hub", amount: "$710", delta: "+5.6%" },
];

type Props = {
  adminBase: string;
  data: RevenueDashboardData;
};

function hubSlugForKey(key: string): string | null {
  if (key === "platform") return null;
  if (["buyer", "seller", "broker", "investor", "bnhub", "rent"].includes(key)) return key;
  return null;
}

export function AdminRevenueLuxuryClient({ adminBase, data }: Props) {
  const reportsHref = `${adminBase}/reports`;

  const rows =
    data.revenueByHub.length > 0 ?
      data.revenueByHub.map((h) => {
        const slug = hubSlugForKey(h.hubKey);
        const delta =
          h.deltaPctVsPriorDay != null ? `${h.deltaPctVsPriorDay >= 0 ? "+" : ""}${h.deltaPctVsPriorDay.toFixed(1)}%` : "—";
        return {
          id: `hub-${h.hubKey}-${h.amountCents}`,
          slug: (slug ?? "buyer") as (typeof revenueByHubDemo)[number]["slug"],
          hub: h.hubLabel,
          amount: formatCadCompactFromCents(h.amountCents),
          delta,
          href: slug ? `${adminBase}/hubs/${slug}` : adminBase,
        };
    })
  : revenueByHubDemo.map((d) => ({
      id: `demo-${d.slug}`,
      ...d,
      href: `${adminBase}/hubs/${d.slug}`,
    }));

  const top = data.revenueByHub[0];
  const topSlug = top ? hubSlugForKey(top.hubKey) : null;
  const chartPreview = data.series.slice(-8).map((p) => `${p.date}: ${formatCadCompactFromCents(p.revenueCents)}`).join(" · ");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Revenue & Reports</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">Daily Income Overview</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Monitor revenue from every hub, compare daily performance, and review chart-based operational reports.
            </p>
          </div>
          <Link
            href={adminBase}
            className="shrink-0 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
          >
            ← Command Center
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Today</div>
            <div className="mt-3 text-3xl font-semibold text-white">
              {formatCadCompactFromCents(data.todayRevenueCents)}
            </div>
            <div className="mt-2 text-sm text-white/50">Total daily revenue</div>
          </div>
          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">7-Day Avg</div>
            <div className="mt-3 text-3xl font-semibold text-white">
              {formatCadCompactFromCents(data.sevenDayAverageCents)}
            </div>
            <div className="mt-2 text-sm text-white/50">Rolling weekly average</div>
          </div>
          <Link
            href={topSlug ? `${adminBase}/hubs/${topSlug}` : `${adminBase}/hubs/bnhub`}
            className="block rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Highest Hub</div>
            <div className="mt-3 text-3xl font-semibold text-white">{data.highestHubLabel}</div>
            <div className="mt-2 text-sm text-white/50">Top contributor today →</div>
          </Link>
          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Transactions</div>
            <div className="mt-3 text-3xl font-semibold text-white">{data.transactions}</div>
            <div className="mt-2 text-sm text-white/50">Paid platform payments today</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href={reportsHref}
            className="rounded-[24px] border border-white/8 bg-[#111111] px-5 py-4 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Report</div>
            <div className="mt-2 font-medium text-white">Daily rollup</div>
            <div className="mt-1 text-sm text-white/45">PDF &amp; CSV exports</div>
          </Link>
          <Link
            href={reportsHref}
            className="rounded-[24px] border border-white/8 bg-[#111111] px-5 py-4 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Report</div>
            <div className="mt-2 font-medium text-white">Weekly summary</div>
            <div className="mt-1 text-sm text-white/45">Hub comparison</div>
          </Link>
          <Link
            href={`${adminBase}/movements`}
            className="rounded-[24px] border border-white/8 bg-[#111111] px-5 py-4 transition hover:border-[#D4AF37]/35"
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Correlate</div>
            <div className="mt-2 font-medium text-white">Vs. movements</div>
            <div className="mt-1 text-sm text-white/45">Timeline &amp; payouts</div>
          </Link>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[30px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Revenue chart</div>
            <div className="flex min-h-[360px] flex-col justify-center rounded-[24px] border border-white/8 bg-[#111111] px-4 py-6 text-sm text-white/45">
              <p className="text-center text-white/35">14-day series (platform fee allocation)</p>
              <p className="mt-4 break-words font-mono text-[11px] leading-relaxed text-white/55">{chartPreview || "No series yet."}</p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Revenue by Hub</div>
            <div className="space-y-4">
              {rows.map((item) => (
                <Link
                  key={"id" in item ? item.id : `${item.hub}-${item.amount}`}
                  href={item.href}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#111111] px-4 py-4 text-left transition hover:border-[#D4AF37]/35"
                >
                  <div>
                    <div className="text-white">{item.hub}</div>
                    <div className="mt-1 text-sm text-white/50">{item.delta} vs prior day</div>
                  </div>
                  <div className="text-[#D4AF37]">{item.amount}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-white/35 sm:text-start">
          Totals derive from paid `platform_payments` rows (platform fee when present, else 12% of gross as a fallback estimate).
        </p>
      </div>
    </main>
  );
}
