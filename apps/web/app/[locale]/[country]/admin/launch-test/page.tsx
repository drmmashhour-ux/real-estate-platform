import Link from "next/link";
import { LaunchTestReport } from "@/components/admin/LaunchTestReport";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { runFirstLaunchSimulationReport } from "@/modules/simulation/first-launch-report";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLaunchTestPage() {
  await requireAdminControlUserId();

  const [riskAlerts, report] = await Promise.all([
    getAdminRiskAlerts(),
    Promise.resolve(runFirstLaunchSimulationReport()),
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div />
          <Link
            href="/admin/growth-launch"
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Launch growth →
          </Link>
        </div>
        <LaunchTestReport report={report} />
      </div>
    </LecipmControlShell>
  );
}
