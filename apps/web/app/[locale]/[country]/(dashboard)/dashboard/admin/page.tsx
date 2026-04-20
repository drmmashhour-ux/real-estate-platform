import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { AdminBottlenecksPanel } from "@/components/admin/AdminBottlenecksPanel";
import { AdminFunnelChart } from "@/components/admin/AdminFunnelChart";
import { AdminKPICards } from "@/components/admin/AdminKPICards";
import { AdminPendingActions } from "@/components/admin/AdminPendingActions";
import { AdminRangeFilter } from "@/components/admin/AdminRangeFilter";
import { AdminTimeSeriesChart } from "@/components/admin/AdminTimeSeriesChart";
import { AdminUsageCharts } from "@/components/admin/AdminUsageCharts";
import {
  getBottlenecks,
  getDashboardOverview,
  getPendingActionsSummary,
  getRecentActivityFeed,
  getTimeSeriesMetrics,
  getUsageMetrics,
  getWorkflowFunnel,
  parseAdminRange,
} from "@/modules/analytics/services/admin-analytics-service";
import { legalHubFlags } from "@/config/feature-flags";
import { buildLegalAdminReviewQueue } from "@/modules/legal/legal-admin-review.service";
import { LegalAdminQueueCard } from "@/components/legal/admin/LegalAdminQueueCard";
import { LegalAdminRisksTable } from "@/components/legal/admin/LegalAdminRisksTable";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminOperationsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/admin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const range = parseAdminRange({
    range: sp.range ?? "30d",
    from: sp.from ?? null,
    to: sp.to ?? null,
  });

  const overview = await getDashboardOverview();
  const funnel = await getWorkflowFunnel();
  const pending = await getPendingActionsSummary();
  const usage = await getUsageMetrics(range);
  const bottlenecks = await getBottlenecks();
  const series = await getTimeSeriesMetrics(range);
  const feed = await getRecentActivityFeed(22);

  const adminDecision = await safeEvaluateDecision({
    hub: "admin",
    userId,
    userRole: "ADMIN",
    entityType: "platform",
    entityId: null,
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Platform overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
            Read-only KPIs, funnel health, pending work, and usage for the last period. Admin access only.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminRangeFilter current={sp.range === "7d" ? "7d" : "30d"} />
          <Link
            href={`/${locale}/${country}/dashboard/admin/automation`}
            className="text-sm font-medium text-premium-gold hover:underline"
          >
            Automation &amp; AI assist center →
          </Link>
        </div>
      </div>

      <DecisionCard
        title="Admin — daily AI risk & anomalies"
        result={adminDecision}
        actionHref="/dashboard/admin/daily"
        actionLabel="Open daily report"
        className="border-premium-gold/30 bg-black/40"
      />

      {legalReviewQueue ? (
        <section
          className="rounded-2xl border border-premium-gold/25 bg-black/35 p-5"
          aria-label="Legal hub operator summary"
        >
          <h2 className="text-sm font-semibold text-white">Legal hub — operator summary</h2>
          <p className="mt-1 text-xs text-[#737373]">
            Aggregated readiness signals only.{" "}
            <Link href={`/${locale}/${country}/legal`} className="text-premium-gold hover:underline">
              Open Legal Hub
            </Link>
            {" · "}
            <Link href="/api/admin/legal" className="text-premium-gold hover:underline">
              JSON summary
            </Link>
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <LegalAdminQueueCard items={legalReviewQueue.items} />
            <LegalAdminRisksTable
              rows={[
                {
                  label: "FSBO pending verification (aggregate)",
                  value: legalReviewQueue.items.find((i) => i.label.includes("awaiting verification"))?.count ?? 0,
                },
                {
                  label: "FSBO moderation rejected (aggregate)",
                  value: legalReviewQueue.items.find((i) => i.label.includes("rejected"))?.count ?? 0,
                },
                {
                  label: "Broker license pending (aggregate)",
                  value: legalReviewQueue.items.find((i) => i.label.includes("Broker licenses"))?.count ?? 0,
                },
              ]}
            />
          </div>
        </section>
      ) : null}

      <section
        className="rounded-2xl border border-premium-gold/25 bg-black/35 p-5"
        aria-label="Growth shortcuts"
      >
        <h2 className="text-sm font-semibold text-white">Growth &amp; conversion</h2>
        <p className="mt-1 text-xs text-[#737373]">
          Daily lead heat, campaigns, and autopilot suggestions are in the growth admin — same tracking as listings and BNHub
          funnels.
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-6">
          <li>
            <Link href="/admin/growth-dashboard" className="font-medium text-premium-gold hover:underline">
              Growth dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/growth-metrics" className="font-medium text-premium-gold hover:underline">
              Campaigns &amp; metrics
            </Link>
          </li>
          <li>
            <Link href="/admin/growth-autopilot-v2" className="font-medium text-premium-gold hover:underline">
              Autopilot
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/${country}/dashboard/admin/investment-recommendations`}
              className="font-medium text-premium-gold hover:underline"
            >
              BNHub investment signals
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/${country}/dashboard/admin/autonomy`}
              className="font-medium text-premium-gold hover:underline"
            >
              BNHub autonomy audit
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Key metrics</h2>
        <AdminKPICards overview={overview} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-white">Conversion funnel</h2>
          <p className="mt-1 text-xs text-[#737373]">CRM stages through offers and contracts (snapshot).</p>
          <div className="mt-4">
            <AdminFunnelChart funnel={funnel} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-white">Pending actions requiring attention</h2>
          <p className="mt-1 text-xs text-[#737373]">Aggregated operational backlog.</p>
          <div className="mt-4">
            <AdminPendingActions summary={pending} />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Usage metrics</h2>
        <p className="mt-1 text-xs text-[#737373]">
          Range: {range.from} → {range.to} ({range.preset})
        </p>
        <div className="mt-4">
          <AdminUsageCharts usage={usage} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Activity trend</h2>
        <p className="mt-1 text-xs text-[#737373]">Daily composite volume for the selected window.</p>
        <div className="mt-6">
          <AdminTimeSeriesChart series={series} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-white">Bottlenecks</h2>
          <p className="mt-1 text-xs text-[#737373]">Items exceeding SLA-style thresholds.</p>
          <div className="mt-4">
            <AdminBottlenecksPanel bottlenecks={bottlenecks} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-white">Recent activity</h2>
          <p className="mt-1 text-xs text-[#737373]">Latest offers, contracts, appointments, documents, intake.</p>
          <div className="mt-4">
            <AdminActivityFeed items={feed} />
          </div>
        </section>
      </div>
    </div>
  );
}
