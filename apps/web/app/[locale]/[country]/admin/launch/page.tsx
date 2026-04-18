import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { LaunchOpsDashboard } from "@/components/admin/LaunchOpsDashboard";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLaunchFunnelMetrics } from "@/modules/launch/launch-metrics.service";
import { generateFirstUsersLaunchStrategy } from "@/modules/launch/launch-strategy.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLaunchPage() {
  await requireAdminControlUserId();

  const [riskAlerts, plan, metrics] = await Promise.all([
    getAdminRiskAlerts(),
    Promise.resolve(generateFirstUsersLaunchStrategy()),
    getLaunchFunnelMetrics(30),
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
      <LaunchOpsDashboard plan={plan} metrics={metrics} />
    </LecipmControlShell>
  );
}
