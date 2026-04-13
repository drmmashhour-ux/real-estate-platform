import Link from "next/link";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsHubPage() {
  await requireAdminControlUserId();

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  const [stats, closedDeals, signups, riskAlerts] = await Promise.all([
    getPlatformStats(30),
    prisma.deal.count({
      where: { status: "closed", updatedAt: { gte: thirtyAgo } },
    }),
    prisma.user.count({ where: { createdAt: { gte: thirtyAgo } } }),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  const funnel = [
    { label: "Tracked visitors", value: stats.totals.visitors, color: "#D4AF37" },
    { label: "New accounts (30d)", value: signups, color: "#6366f1" },
    { label: "New listings (broker + self)", value: stats.totals.listingsTotal, color: "#22c55e" },
    { label: "Booking / payment closes", value: stats.totals.transactionsClosed, color: "#f97316" },
    { label: "Deals closed (30d)", value: closedDeals, color: "#a855f7" },
  ];

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Traffic, supply, and conversion-style funnel — drill into specialized dashboards as needed.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/analytics/product" className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900">
            Product insights →
          </Link>
          <Link href="/admin/organic-analytics" className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900">
            Organic analytics →
          </Link>
          <Link href="/admin/revenue-dashboard" className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900">
            Revenue dashboard →
          </Link>
          <Link href="/admin/growth-funnel-data" className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900">
            Growth funnel data →
          </Link>
        </div>

        <AdminAnalyticsCharts series={stats.series} funnel={funnel} />
      </div>
    </LecipmControlShell>
  );
}
