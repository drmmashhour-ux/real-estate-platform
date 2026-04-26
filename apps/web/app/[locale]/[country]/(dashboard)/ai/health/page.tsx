import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getManagerAiRunCounts } from "@/lib/ai/observability/metrics";
import { AIExecutionFeed } from "@/components/ai/AIExecutionFeed";

const GOLD = "#D4AF37";

export default async function AiHealthPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/health");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  const since = new Date(Date.now() - 86400000);
  const [metrics, health, runs] = await Promise.all([
    getManagerAiRunCounts(since),
    prisma.managerAiHealthEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.managerAiAgentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, agentKey: true, status: true, createdAt: true, outputSummary: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">AI health</h1>
        <p className="mt-1 text-sm text-white/50">24h counts from real logs only — no synthetic KPIs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
          <p className="text-xs uppercase tracking-wider text-white/45" style={{ color: GOLD }}>
            Agent runs
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{metrics.runs}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
          <p className="text-xs uppercase tracking-wider text-white/45">Actions executed</p>
          <p className="mt-2 text-2xl font-semibold text-white">{metrics.actionsExecuted}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
          <p className="text-xs uppercase tracking-wider text-white/45">Actions failed</p>
          <p className="mt-2 text-2xl font-semibold text-white">{metrics.actionsFailed}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Health events</h2>
        <ul className="space-y-2 text-sm text-white/70">
          {health.length === 0 ? <li className="text-white/40">None recorded.</li> : null}
          {health.map((h) => (
            <li key={h.id} className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2">
              <span className="text-xs text-white/40">{h.createdAt.toISOString()}</span> ·{" "}
              <span className="font-medium text-white/85">{h.level}</span> · {h.source}
              <span className="mt-1 block text-white/55">{h.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent executions</h2>
        <AIExecutionFeed runs={runs} />
      </section>
    </div>
  );
}
