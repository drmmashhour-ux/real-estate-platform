import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { notFound, redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { AdminHubCharts } from "@/components/admin/AdminHubCharts";
import { AdminReportRevenueChart } from "@/components/admin/AdminReportRevenueChart";
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  generateYearlyReport,
  type AdminReportPeriod,
} from "@/modules/ai/admin-reports";
import { getPeriodBounds, getRevenueSummary } from "@/modules/finance/reporting";

export const dynamic = "force-dynamic";

const VALID = new Set<AdminReportPeriod>(["daily", "weekly", "monthly", "yearly"]);

export default async function AdminReportPeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN" && me?.role !== "ACCOUNTANT") redirect("/");
  const role = await getUserRole();

  const { period: raw } = await params;
  const period = raw as AdminReportPeriod;
  if (!VALID.has(period)) notFound();

  const report =
    period === "daily"
      ? await generateDailyReport()
      : period === "weekly"
        ? await generateWeeklyReport()
        : period === "monthly"
          ? await generateMonthlyReport()
          : await generateYearlyReport();

  const range = getPeriodBounds(period);
  const revenue = await getRevenueSummary(range);
  const statDays = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  const stats = await getPlatformStats(statDays);

  const title =
    period === "daily"
      ? "Daily report"
      : period === "weekly"
        ? "Weekly report"
        : period === "monthly"
          ? "Monthly report"
          : "Yearly report";

  return (
    <HubLayout title={title} hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/reports" className="text-sm text-[#C9A646] hover:underline">
              ← Reports hub
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              Operational snapshot from live DB — not a substitute for audited financial statements.{" "}
              {report.periodStart ?? ""} → {report.periodEnd ?? ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/finance/export?format=csv&type=admin_report&period=${period}`}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-[#C9A646]/50"
            >
              Export CSV
            </a>
            <a
              href={`/api/admin/finance/export?format=json&type=admin_report&period=${period}`}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-[#C9A646]/50"
            >
              Export JSON
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-4 text-sm text-amber-100/90">
          These reports are operational summaries for administration and tax preparation support. They do not replace formal
          accounting, legal review, or government filings.
        </div>

        <section className="rounded-2xl border border-[#C9A646]/25 bg-[#0a0a0a] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">{report.period}</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{report.headline}</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-400">
            {report.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>

        {report.kpis && report.kpis.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {report.kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{k.value}</p>
              </div>
            ))}
          </section>
        ) : null}

        {report.financeInsights && report.financeInsights.length > 0 ? (
          <section className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5">
            <h3 className="text-sm font-semibold text-rose-200/90">Finance & risk signals</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">
              {report.financeInsights.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#C9A646]/20 bg-[#0a0a0a] p-4 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#C9A646]">Revenue by hub (paid platform payments)</h3>
            <p className="mt-1 text-xs text-slate-500">Mapped from paymentType — see finance module for rules.</p>
            <div className="mt-4">
              <AdminReportRevenueChart byHub={revenue.byHubLabel} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#C9A646]/20 bg-[#0a0a0a] p-4 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#C9A646]">Listing & booking signals</h3>
            <AdminHubCharts stats={stats} />
          </div>
        </section>

        <p className="text-[10px] text-slate-600">Generated {report.generatedAt}</p>
      </div>
    </HubLayout>
  );
}
