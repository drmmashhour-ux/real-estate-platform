import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { AIApprovalBanner } from "@/components/ai/AIApprovalBanner";
import { AISummaryWidget } from "@/components/ai/AISummaryWidget";

const GOLD = "#D4AF37";

export default async function AiOverviewPage() {
  const userId = await getGuestId();
  const admin = userId ? await isPlatformAdmin(userId) : false;

  const [activeRecs, pendingApprovals, failedRuns, recentRuns] = await Promise.all([
    userId
      ? prisma.managerAiRecommendation.count({ where: { userId, status: "active" } })
      : 0,
    admin ? prisma.managerAiApprovalRequest.count({ where: { status: "pending" } }) : 0,
    admin
      ? prisma.managerAiAgentRun.count({
          where: { status: "failed", createdAt: { gte: new Date(Date.now() - 864e5) } },
        })
      : 0,
    userId
      ? prisma.managerAiAgentRun.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, agentKey: true, status: true, createdAt: true, outputSummary: true },
        })
      : [],
  ]);

  return (
    <div className="space-y-8">
      {admin ? <AIApprovalBanner count={pendingApprovals} /> : null}
      {admin ? (
        <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
          <h2 className="text-sm font-semibold" style={{ color: GOLD }}>
            Overview
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-white/45">Your active recommendations</dt>
              <dd className="text-2xl font-semibold text-white">{activeRecs}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Pending approvals (admin)</dt>
              <dd className="text-2xl font-semibold text-white">{pendingApprovals}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Failed AI runs (24h)</dt>
              <dd className="text-2xl font-semibold text-white">{failedRuns}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-white/55">
          Signed-in view: recommendations and chat are scoped to your account. Admin queues require platform admin.
        </p>
      )}

      {admin ? <AISummaryWidget /> : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent AI runs (you)</h2>
        <ul className="space-y-2 text-sm text-white/70">
          {recentRuns.length === 0 ? <li className="text-white/40">No runs logged yet.</li> : null}
          {recentRuns.map((r) => (
            <li key={r.id} className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2">
              <span className="font-mono text-xs text-white/40">{r.createdAt.toISOString()}</span> · {r.agentKey} ·{" "}
              {r.status}
              {r.outputSummary ? <span className="block text-white/50">{r.outputSummary.slice(0, 120)}…</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ai/recommendations"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
          style={{ backgroundColor: GOLD }}
        >
          Open recommendations
        </Link>
        <Link
          href="/dashboard/host"
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/85 hover:bg-white/5"
        >
          Host dashboard
        </Link>
      </div>
    </div>
  );
}
