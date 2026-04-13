import Link from "next/link";
import { DisputeStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

const CLOSED_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.RESOLVED,
  DisputeStatus.REJECTED,
  DisputeStatus.CLOSED,
  DisputeStatus.RESOLVED_PARTIAL_REFUND,
  DisputeStatus.RESOLVED_FULL_REFUND,
  DisputeStatus.RESOLVED_RELOCATION,
];

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  await requireAdminControlUserId();

  const [riskAlerts, openDisputes, openLegal] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.dispute.count({ where: { status: { notIn: CLOSED_DISPUTE_STATUSES } } }).catch(() => 0),
    prisma.platformLegalDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }).catch(() => 0),
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Risk engine output plus live dispute counters — same feed as the header bell.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Risk items</p>
            <p className="mt-1 text-2xl font-bold text-white">{riskAlerts.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">BNHUB disputes open</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{openDisputes}</p>
            <Link href="/admin/disputes" className="mt-2 inline-block text-xs text-zinc-400 hover:text-zinc-200">
              Disputes →
            </Link>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Platform legal open</p>
            <p className="mt-1 text-2xl font-bold text-rose-300">{openLegal}</p>
            <Link href="/admin/legal" className="mt-2 inline-block text-xs text-zinc-400 hover:text-zinc-200">
              Legal →
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">All risk alerts</h2>
          <ul className="mt-4 space-y-3">
            {riskAlerts.length === 0 ? (
              <li className="text-sm text-zinc-500">No alerts from the risk engine right now.</li>
            ) : (
              riskAlerts.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    className={`block rounded-xl border px-4 py-3 text-sm transition hover:bg-zinc-900 ${
                      r.severity === "high"
                        ? "border-red-900/50 bg-red-950/20"
                        : r.severity === "medium"
                          ? "border-amber-900/40 bg-amber-950/10"
                          : "border-zinc-800"
                    }`}
                  >
                    <span className="font-medium text-zinc-100">{r.title}</span>
                    <span className="mt-1 block text-xs text-zinc-500">{r.detail}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
