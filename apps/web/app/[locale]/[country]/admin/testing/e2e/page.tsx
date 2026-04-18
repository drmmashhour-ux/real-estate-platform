import Link from "next/link";
import { FullPlatformSimulationDashboard } from "@/components/testing/FullPlatformSimulationDashboard";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTestingE2ePage() {
  await requireAdminControlUserId();

  const riskAlerts = await getAdminRiskAlerts();
  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Full platform E2E simulation</h1>
            <p className="mt-1 text-sm text-zinc-400">
              LECIPM Full Browser E2E Validation v1 — report includes Playwright Chromium results when{" "}
              <code className="text-zinc-300">pnpm run simulate:platform</code> runs (not{" "}
              <code className="text-zinc-300">E2E_SIMULATION_PLAYWRIGHT=0</code>). Reads{" "}
              <code className="text-zinc-300">tests/reports/final-e2e-report.json</code>. PASS requires real execution —
              no fake success.
            </p>
          </div>
          <Link
            href="/admin/testing"
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            ← System validation
          </Link>
        </div>
        <FullPlatformSimulationDashboard />
      </div>
    </LecipmControlShell>
  );
}
