import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function ContextualAutonomyPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/autonomy/contextual`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const [stats, actions] = await Promise.all([
    prisma.contextualActionStat.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.autonomyAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · autonomy · contextual
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Contextual Bandit Engine</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Feature-aware decision engine: deterministic bucket labels + observed bucket-level rewards. Not unrestricted ML —
            rankings are explainable and policy-validated per action.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin/autonomy`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Autonomy
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Recent contextual stats</h2>
        <p className="mt-1 text-xs text-[#737373]">
          Per scope, domain, signal, action, and feature bucket — aggregate outcomes only (not causal attribution).
        </p>
        <div className="mt-4 space-y-3">
          {stats.length === 0 ? (
            <p className="text-sm text-[#737373]">No contextual stats yet — outcomes will populate buckets after learning runs.</p>
          ) : (
            stats.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.domain} · {row.signalKey} · {row.actionType}
                </div>
                <div>
                  Feature: {row.featureKey} = {row.featureBucket}
                </div>
                <div>Avg reward: {row.averageReward}</div>
                <div>Successes: {row.successCount}</div>
                <div>Failures: {row.failureCount}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Recent autonomy actions</h2>
        <div className="mt-4 space-y-3">
          {actions.length === 0 ? (
            <p className="text-sm text-[#737373]">No actions recorded.</p>
          ) : (
            actions.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.domain} · {row.actionType} · {row.status}
                </div>
                <div>Signal key: {row.signalKey || "—"}</div>
                <div>Ranking score (stored as confidence): {row.confidence ?? 0}</div>
                <div className="break-all font-mono text-xs text-zinc-500">
                  Context: {JSON.stringify(row.contextFeaturesJson ?? {})}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
