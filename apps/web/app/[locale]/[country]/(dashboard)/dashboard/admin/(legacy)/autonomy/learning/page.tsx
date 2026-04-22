import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AutonomyLearningPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/autonomy/learning`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const [outcomes, ruleWeights, logs] = await Promise.all([
    prisma.autonomyOutcome.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.autonomyRuleWeight.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.autonomyLearningLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · autonomy · learning
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Self-Learning Autonomy</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Deterministic, outcome-based adjustment of preference weights and future confidence. Reinforcement-style tuning from
            observed revenue, occupancy, bookings, ADR, and RevPAR — within hard policy guardrails (never silently changing safety
            limits).
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
        <h2 className="text-sm font-semibold text-white">Recent outcomes</h2>
        <p className="mt-1 text-xs text-[#737373]">
          Traceable deltas vs stored baselines at action time; reward score is a transparent composite (not causal inference).
        </p>
        <div className="mt-4 space-y-3">
          {outcomes.length === 0 ? (
            <p className="text-sm text-[#737373]">No outcomes evaluated yet — run POST /api/autonomy/learning/run after actions age past the learning window.</p>
          ) : (
            outcomes.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.scopeType} · {row.scopeId} · {row.outcomeLabel ?? "—"}
                </div>
                <div>Reward: {row.rewardScore ?? 0}</div>
                <div>Revenue Δ: {row.revenueDelta ?? 0}</div>
                <div>Occupancy Δ: {row.occupancyDelta ?? 0}</div>
                <div>Bookings Δ: {row.bookingDelta ?? 0}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Rule weights</h2>
        <p className="mt-1 text-xs text-[#737373]">Bounded weight nudges (0.5–1.5) per scope, domain, signal, and action type.</p>
        <div className="mt-4 space-y-3">
          {ruleWeights.length === 0 ? (
            <p className="text-sm text-[#737373]">No weights yet — created on first scored outcome with a signal key.</p>
          ) : (
            ruleWeights.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.domain} · {row.signalKey} → {row.actionType}
                </div>
                <div>Weight: {row.weight}</div>
                <div>Successes: {row.successCount}</div>
                <div>Failures: {row.failureCount}</div>
                <div>Total reward: {row.totalReward}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Learning logs</h2>
        <div className="mt-4 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[#737373]">No learning events yet.</p>
          ) : (
            logs.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">{row.eventType}</div>
                <div>{row.message || "—"}</div>
                <div className="mt-1 text-xs text-zinc-600">{row.createdAt.toISOString()}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
