import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminAutonomyPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/autonomy`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const [actions, configs, recentLogs] = await Promise.all([
    prisma.autonomyAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.autonomyConfig.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.autonomyEventLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · autonomy
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Autonomous asset manager</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Deterministic signals → policy → execution (mode-gated). No black-box AI; all rows are auditable. OFF / ASSIST never
            mutates pricing without SAFE_AUTOPILOT + policy pass.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/${locale}/${country}/dashboard/admin/autonomy/contextual`}
            className="text-sm font-medium text-premium-gold hover:underline"
          >
            Contextual Bandit →
          </Link>
          <Link
            href={`/${locale}/${country}/dashboard/admin/autonomy/learning`}
            className="text-sm font-medium text-premium-gold hover:underline"
          >
            Self-Learning Autonomy →
          </Link>
          <Link
            href={`/${locale}/${country}/dashboard/admin`}
            className="text-sm font-medium text-premium-gold hover:underline"
          >
            ← Admin overview
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Active configs ({configs.length})</h2>
        <p className="mt-1 text-xs text-[#737373]">One row per scope — create via Prisma/admin tooling if empty.</p>
        <ul className="mt-4 space-y-2 text-sm text-[#B3B3B3]">
          {configs.length === 0 ? (
            <li>No autonomy configs yet.</li>
          ) : (
            configs.map((c) => (
              <li key={c.id} className="flex flex-wrap gap-2 border-b border-white/5 py-2">
                <span className="font-mono text-white">{c.scopeType}</span>
                <span className="font-mono text-zinc-400">{c.scopeId.slice(0, 12)}…</span>
                <span className="text-zinc-500">mode {c.mode}</span>
                <span className={c.isEnabled ? "text-emerald-400" : "text-zinc-600"}>
                  {c.isEnabled ? "enabled" : "disabled"}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Recent actions</h2>
        <div className="mt-4 space-y-3">
          {actions.length === 0 ? (
            <p className="text-sm text-[#737373]">No autonomy actions recorded yet.</p>
          ) : (
            actions.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-white">
                    {a.domain} · {a.actionType}
                  </span>
                  <span className="text-xs uppercase text-zinc-500">{a.status}</span>
                </div>
                <div className="mt-1 font-mono text-xs text-zinc-500">
                  {a.scopeType} / {a.scopeId}
                </div>
                {a.reason ? <div className="mt-2 text-[#B3B3B3]">{a.reason}</div> : null}
                <div className="mt-1 text-xs text-zinc-600">
                  {a.createdAt.toISOString()}
                  {a.executedAt ? ` · executed ${a.executedAt.toISOString()}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Event log (sample)</h2>
        <ul className="mt-3 space-y-2 text-xs text-[#737373]">
          {recentLogs.map((e) => (
            <li key={e.id} className="border-b border-white/5 py-2">
              <span className="text-zinc-400">{e.eventType}</span> · {e.message ?? "—"} ·{" "}
              {e.createdAt.toISOString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
