import { ControlTowerOverview } from "@/components/admin/ControlTowerOverview";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import {
  getAdminActivityFeed,
  getAdminAiOps,
  getAdminBookingHealth,
  getAdminDashboardStats,
  getAdminListingsHealth,
  getAdminRiskAlerts,
} from "@/lib/admin/control-center";
import { getAdminOverviewStats } from "@/lib/admin/get-admin-overview";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminControlTowerOverviewPage() {
  await requireAdminControlUserId();

  const [overview, stats, activity, listingsHealth, bookingHealth, aiOps, riskAlerts] = await Promise.all([
    getAdminOverviewStats(),
    getAdminDashboardStats(),
    getAdminActivityFeed(24),
    getAdminListingsHealth(),
    getAdminBookingHealth(),
    getAdminAiOps(),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <ControlTowerOverview
        overview={overview}
        stats={stats}
        activity={activity}
        listingsHealth={listingsHealth}
        bookingHealth={bookingHealth}
        aiOps={aiOps}
        riskAlerts={riskAlerts}
      />
    </LecipmControlShell>
  );
}
