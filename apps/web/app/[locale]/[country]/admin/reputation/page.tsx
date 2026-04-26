import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { ReputationComplaintActions } from "@/components/admin/ReputationComplaintActions";
import { ReputationReviewModActions } from "@/components/admin/ReputationReviewModActions";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReputationPage() {
  await requireAdminControlUserId();

  const [
    riskAlerts,
    topHosts,
    topListings,
    lowHosts,
    complaints,
    flaggedReviews,
    dist,
  ] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.reputationScore.findMany({
      where: { entityType: "host", score: { gte: 70 } },
      orderBy: { score: "desc" },
      take: 15,
    }),
    prisma.reputationScore.findMany({
      where: { entityType: "listing", score: { gte: 70 } },
      orderBy: { score: "desc" },
      take: 15,
    }),
    prisma.reputationScore.findMany({
      where: { entityType: "host", score: { lte: 40 } },
      orderBy: { score: "asc" },
      take: 15,
    }),
    prisma.reputationComplaint.findMany({
      where: { status: { in: ["open", "under_review"] } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.reputationReview.findMany({
      where: { status: { in: ["flagged", "pending"] } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.reputationScore.groupBy({
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
          <h1 className="mt-4 text-2xl font-bold text-white">Reputation</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform reputation scores, reviews, and complaints. See{" "}
            <code className="text-zinc-400">docs/security/reputation-system.md</code>.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Level distribution</h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
            {dist.map((t) => (
              <li key={t.level}>
                {t.level}: <span className="text-zinc-200">{t._count._all}</span>
              </li>
            ))}
            {dist.length === 0 ? <li className="text-zinc-500">No rows — run recompute API after activity.</li> : null}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Top hosts</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-400">
              {topHosts.map((r) => (
                <li key={r.id}>
                  {r.entityId.slice(0, 10)}… · {r.score} · {r.level}
                </li>
              ))}
              {topHosts.length === 0 ? <li className="text-zinc-600">—</li> : null}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Top listings</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-400">
              {topListings.map((r) => (
                <li key={r.id}>
                  {r.entityId.slice(0, 10)}… · {r.score} · {r.level}
                </li>
              ))}
              {topListings.length === 0 ? <li className="text-zinc-600">—</li> : null}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-amber-200">Low reputation hosts (watchlist)</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-400">
            {lowHosts.map((r) => (
              <li key={r.id}>
                {r.entityId.slice(0, 10)}… · {r.score} · {r.level}
              </li>
            ))}
            {lowHosts.length === 0 ? <li className="text-zinc-600">—</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Complaint queue</h2>
          <ul className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {complaints.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 px-4 py-3 text-sm text-zinc-300 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-500">{c.id.slice(0, 8)}…</span> {c.entityType} ·{" "}
                  {c.category} · <span className="text-zinc-500">{c.status}</span>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.description}</p>
                </div>
                <ReputationComplaintActions complaintId={c.id} />
              </li>
            ))}
            {complaints.length === 0 ? <li className="px-4 py-6 text-zinc-500">No open complaints.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Reviews (pending / flagged)</h2>
          <ul className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {flaggedReviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3 text-sm text-zinc-300 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-500">{r.id.slice(0, 8)}…</span> · {r.subjectEntityType}{" "}
                  · ★{r.rating} · <span className="text-zinc-500">{r.status}</span>
                  {r.title ? <p className="text-xs text-zinc-400">{r.title}</p> : null}
                </div>
                <ReputationReviewModActions reviewId={r.id} />
              </li>
            ))}
            {flaggedReviews.length === 0 ? <li className="px-4 py-6 text-zinc-500">None.</li> : null}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
