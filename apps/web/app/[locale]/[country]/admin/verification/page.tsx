import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { VerificationRequestActions } from "@/components/admin/VerificationRequestActions";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVerificationPage() {
  await requireAdminControlUserId();

  const [riskAlerts, pending, recent, trustDist] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.verificationRequest.findMany({
      where: { status: "pending" },
      orderBy: { submittedAt: "desc" },
      take: 60,
    }),
    prisma.verificationRequest.findMany({
      where: { status: { in: ["approved", "rejected"] } },
      orderBy: { reviewedAt: "desc" },
      take: 25,
    }),
    prisma.platformTrustScore.groupBy({
      by: ["level"],
      _count: { _all: true },
    }),
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
          <h1 className="mt-4 text-2xl font-bold text-white">Verification queue</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Broker and listing verification requests. Trust scores:{" "}
            <code className="text-zinc-400">platform_trust_scores</code>. Doc:{" "}
            <code className="text-zinc-400">docs/security/trust-verification-system.md</code>.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Trust tier distribution</h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
            {trustDist.map((t) => (
              <li key={t.level}>
                {t.level}: <span className="text-zinc-200">{t._count._all}</span>
              </li>
            ))}
            {trustDist.length === 0 ? <li className="text-zinc-500">No rows yet — run POST /api/trust/recompute/…</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Queue</h2>
          <ul className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-500">{r.id.slice(0, 8)}…</span>{" "}
                  <span className="text-zinc-100">{r.type}</span> · user {r.userId?.slice(0, 8) ?? "—"} · listing{" "}
                  {r.listingId?.slice(0, 8) ?? "—"}
                </div>
                <VerificationRequestActions requestId={r.id} />
              </li>
            ))}
            {pending.length === 0 ? <li className="px-4 py-6 text-zinc-500">No requests in this filter.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Recent decisions</h2>
          <ul className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-2 text-sm text-zinc-400">
                <span className="text-zinc-200">{r.status}</span> · {r.type} · {r.reviewedAt?.toISOString() ?? "—"}
              </li>
            ))}
            {recent.length === 0 ? <li className="px-4 py-6 text-zinc-500">None yet.</li> : null}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
