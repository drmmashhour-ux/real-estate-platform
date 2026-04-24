import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function CounterfactualAutonomyPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/autonomy/counterfactual`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const [evaluations, logs, matches] = await Promise.all([
    prisma.counterfactualEvaluation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.upliftLearningLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.counterfactualMatchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · autonomy · counterfactual
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Counterfactual evaluator & uplift estimate</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Deterministic internal-data estimates (trend projection + contextual stat matches). These are{" "}
            <span className="text-white">not</span> randomized trials or proven causal attribution — uplift scores inform learning only;
            policy and execution guardrails are unchanged.
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
        <h2 className="text-sm font-semibold text-white">Recent evaluations</h2>
        <p className="mt-1 text-xs text-[#737373]">Observed vs expected KPIs (counterfactual estimate) and uplift score.</p>
        <div className="mt-4 space-y-3">
          {evaluations.length === 0 ? (
            <p className="text-sm text-[#737373]">No rows yet — learning cycle stores evaluations after outcomes.</p>
          ) : (
            evaluations.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.scopeType} · {row.scopeId} · {row.estimateMethod ?? "—"}
                </div>
                <div>Observed revenue: {row.observedRevenue ?? 0}</div>
                <div>Expected revenue (estimate): {row.expectedRevenue ?? 0}</div>
                <div>Uplift revenue: {row.upliftRevenue ?? 0}</div>
                <div>Uplift score: {row.upliftScore ?? 0}</div>
                <div>Confidence: {row.confidenceScore ?? 0}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Context match logs</h2>
        <p className="mt-1 text-xs text-[#737373]">Per-feature bucket alignment with contextual action stats.</p>
        <div className="mt-4 space-y-3">
          {matches.length === 0 ? (
            <p className="text-sm text-[#737373]">No match logs yet.</p>
          ) : (
            matches.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">
                  {row.featureKey} = {row.featureValue}
                </div>
                <div>Matched count: {row.matchedCount}</div>
                <div>Average reward: {row.averageReward}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Uplift logs</h2>
        <div className="mt-4 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[#737373]">No uplift events yet.</p>
          ) : (
            logs.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">{row.eventType}</div>
                <div>{row.message || "—"}</div>
                <div className="text-xs text-[#737373]">{row.createdAt.toISOString()}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
