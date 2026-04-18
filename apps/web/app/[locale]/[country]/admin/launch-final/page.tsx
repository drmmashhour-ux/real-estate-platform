import Link from "next/link";
import { LaunchFinalValidationDashboard } from "@/components/admin/LaunchFinalValidationDashboard";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { runFinalLaunchValidation } from "@/modules/launch/final-validator.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLaunchFinalPage() {
  await requireAdminControlUserId();

  const [riskAlerts, report] = await Promise.all([
    getAdminRiskAlerts(),
    runFinalLaunchValidation({
      /** Admin UI: fast snapshot — run CLI with LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 for real payment proof. */
      runStripeE2e: process.env.LAUNCH_ADMIN_STRIPE_E2E === "1",
      runTypecheck: process.env.LAUNCH_ADMIN_TYPECHECK === "1",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL?.trim(),
    }),
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
          <Link
            href="/admin/launch-test"
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            ← Launch simulation
          </Link>
        </div>
        <LaunchFinalValidationDashboard report={report} />
      </div>
    </LecipmControlShell>
  );
}
