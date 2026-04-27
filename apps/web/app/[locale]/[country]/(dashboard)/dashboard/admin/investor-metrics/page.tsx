import Link from "next/link";
import { redirect } from "next/navigation";

import { getInvestorMetrics } from "@/lib/finance/investorMetrics";
import { getCampaignLearningSummary } from "@/lib/marketing/campaignLearning";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Investor metrics" };

function fmtCents(c: number) {
  return (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function InvestorMetricsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  const m = await getInvestorMetrics();
  const learning = await getCampaignLearningSummary().catch((): Awaited<ReturnType<typeof getCampaignLearningSummary>> | null => null);

  const cards: { label: string; value: string }[] = [
    { label: "GMV", value: fmtCents(m.gmvCents) },
    { label: "Platform revenue (fees)", value: fmtCents(m.platformRevenueCents) },
    { label: "Net revenue (after alloc. refunds)", value: fmtCents(m.netRevenueCents) },
    { label: "Total bookings (confirmed)", value: String(m.totalBookings) },
    { label: "Total nights", value: String(m.totalNights) },
    { label: "Average booking value", value: fmtCents(m.averageBookingValueCents) },
    { label: "ADR (subtotal / nights)", value: fmtCents(m.averageDailyRateCents) },
    { label: "Refunds (cumulative)", value: fmtCents(m.refundCents) },
  ];

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 61</p>
        <h1 className="mt-2 text-2xl font-bold">Investor metrics</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Marketplace `Booking` rows with <code className="rounded bg-zinc-800 px-1">status=confirmed</code> and price
          snapshots. GMV = sum of <code className="rounded bg-zinc-800 px-1">finalCents</code> (guest totals).
        </p>
        <div className="mt-3">
          <Link href={base} className="text-sm text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
        </div>
      </div>

      {learning != null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Best platform (simulated ads)</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{learning.bestPlatform ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Best audience (simulated ads)</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{learning.bestAudience ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Winning pattern groups</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{String(learning.winningPatternCount)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-500">{c.label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
