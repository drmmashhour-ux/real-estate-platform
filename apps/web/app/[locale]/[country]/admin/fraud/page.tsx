import Link from "next/link";
import type { FraudCaseStatus, FraudEntityType, FraudRiskLevel } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Search = { entityType?: string; risk?: string; status?: string };

export default async function AdminFraudPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminControlUserId();
  const sp = await searchParams;

  const entityType = sp.entityType as FraudEntityType | undefined;
  const riskLevel = sp.risk as FraudRiskLevel | undefined;
  const status = sp.status as FraudCaseStatus | undefined;

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    ...(status ? { status } : {}),
  };

  const [riskAlerts, cases, recentSignals, dist, topRisk, fraudEventRows] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.fraudCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.fraudSignalEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.fraudPolicyScore.groupBy({
      by: ["riskLevel"],
      _count: { _all: true },
    }),
    prisma.fraudPolicyScore.findMany({
      where: { riskLevel: { in: ["high", "critical"] } },
      orderBy: { score: "desc" },
      take: 24,
    }),
    prisma.fraudEvent.findMany({ orderBy: { createdAt: "desc" }, take: 40 }).catch(() => []),
  ]);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Fraud detection</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Rule-based signals, policy scores, and review queue. See{" "}
            <code className="text-zinc-400">docs/security/fraud-detection-system.md</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <FilterLink label="All" href="/admin/fraud" active={!entityType && !riskLevel && !status} />
          <FilterLink label="Open cases" href="/admin/fraud?status=open" active={status === "open"} />
          <FilterLink label="High risk scores" href="/admin/fraud?risk=high" active={riskLevel === "high"} />
          <FilterLink label="Users" href="/admin/fraud?entityType=user" active={entityType === "user"} />
          <FilterLink label="Listings" href="/admin/fraud?entityType=listing" active={entityType === "listing"} />
          <FilterLink label="Bookings" href="/admin/fraud?entityType=booking" active={entityType === "booking"} />
          <FilterLink label="Payments" href="/admin/fraud?entityType=payment" active={entityType === "payment"} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dist.map((d) => (
            <div key={d.riskLevel} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase text-zinc-500">{d.riskLevel}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{d._count._all}</p>
              <p className="text-xs text-zinc-500">Entities (policy scores)</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Elevated policy scores</h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {topRisk.map((r) => (
                  <tr key={`${r.entityType}-${r.entityId}`}>
                    <td className="px-3 py-2 font-mono">
                      {r.entityType} · {r.entityId.slice(0, 18)}…
                    </td>
                    <td className="px-3 py-2">{r.score}</td>
                    <td className="px-3 py-2">{r.riskLevel}</td>
                    <td className="px-3 py-2">{r.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topRisk.length === 0 ? <p className="p-4 text-center text-zinc-500">No high/critical scores yet.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Fraud cases</h2>
          <div className="mt-2 space-y-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/admin/fraud/${c.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-3 hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-emerald-400/90">{c.title}</span>
                  <span className="text-xs text-zinc-500">
                    {c.status} · {c.riskLevel}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.summary}</p>
              </Link>
            ))}
            {cases.length === 0 ? <p className="text-sm text-zinc-500">No cases match filters.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Fraud events log (v1)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Explainable rows from <code className="text-zinc-400">fraud_events</code> — set{" "}
            <code className="text-zinc-400">FEATURE_LAUNCH_FRAUD_PROTECTION_V1=1</code> and run migrations.
          </p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fraudEventRows.map((ev) => (
                  <tr key={ev.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{ev.createdAt.toISOString()}</td>
                    <td className="px-3 py-2 font-mono text-emerald-400/90">{ev.actionType}</td>
                    <td className="px-3 py-2 font-mono">{ev.userId?.slice(0, 12) ?? "—"}</td>
                    <td className="px-3 py-2">{ev.riskScore}</td>
                    <td className="px-3 py-2">{ev.riskLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fraudEventRows.length === 0 ? (
              <p className="p-4 text-center text-sm text-zinc-500">No rows yet — fraud engine runs on signup, checkout, booking, listing.</p>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Recent signal events</h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Signal</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {recentSignals.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{s.createdAt.toISOString()}</td>
                    <td className="px-3 py-2 font-mono text-emerald-400/90">{s.signalType}</td>
                    <td className="px-3 py-2">
                      {s.entityType} · {s.entityId.slice(0, 14)}…
                    </td>
                    <td className="px-3 py-2">{s.riskPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LecipmControlShell>
  );
}

function FilterLink(props: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={props.href}
      className={`rounded-full px-3 py-1 ${props.active ? "bg-emerald-900/40 text-emerald-100" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
    >
      {props.label}
    </Link>
  );
}
