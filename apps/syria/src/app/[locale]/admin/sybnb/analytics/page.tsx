import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";

export default async function AdminSybnbAnalyticsPage() {
  const t = await getTranslations("Admin");

  const [views, contacts, requests, approvals, reports] = await Promise.all([
    prisma.sybnbEvent.count({ where: { type: SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW } }),
    prisma.sybnbEvent.count({ where: { type: SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK } }),
    prisma.sybnbEvent.count({ where: { type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST } }),
    prisma.sybnbEvent.count({ where: { type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_APPROVED } }),
    prisma.sybnbEvent.count({ where: { type: SYBNB_ANALYTICS_EVENT_TYPES.REPORT_SUBMITTED } }),
  ]);

  const approvalRatePct =
    requests === 0 ? null : Math.round((approvals / requests) * 1000) / 10;

  return (
    <div className="space-y-6 [dir=rtl]:text-right">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{t("sybnbAnalyticsTitle")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("sybnbAnalyticsSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label={t("sybnbAnalyticsListingViews")} value={views} />
        <MetricCard label={t("sybnbAnalyticsContactClicks")} value={contacts} />
        <MetricCard label={t("sybnbAnalyticsBookingRequests")} value={requests} />
        <MetricCard label={t("sybnbAnalyticsBookingApproved")} value={approvals} />
        <MetricCard
          label={t("sybnbAnalyticsApprovalRate")}
          value={approvalRatePct == null ? "—" : `${approvalRatePct}%`}
          hint={t("sybnbAnalyticsExplainRate", { approved: approvals, requests })}
        />
        <MetricCard label={t("sybnbAnalyticsReportsSubmitted")} value={reports} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
