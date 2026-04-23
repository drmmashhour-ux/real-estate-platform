import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getLatestCapitalPlanSummary } from "@/modules/capital-allocator/capital-plan-summary.service";
import { CapitalAllocatorV2Client } from "@/components/capital-allocator/CapitalAllocatorV2Client";

export const dynamic = "force-dynamic";

function currency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const GOLD = "var(--color-premium-gold)";

export default async function CapitalAllocatorPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/dashboard/investor/capital-allocator");

  const plans = await prisma.capitalAllocationPlan.findMany({
    where: { scopeId: userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const latest = await getLatestCapitalPlanSummary(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · portfolio capital
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Deterministic AI capital allocator · portfolio budget recommendations
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Internal operating metrics, uplift signals, and portfolio rules only — auditable scoring and proportional
            constraints. Does not infer external market facts or guaranteed returns; subject to investor/manager approval before
            any discretionary spend.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/investor`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Investor hub
        </Link>
      </div>

      <p className="text-xs text-[#737373]">
        Generate via <span className="font-mono text-zinc-400">POST /api/capital-allocator/plans</span> with{" "}
        <span className="font-mono">scopeType: &quot;portfolio&quot;</span>, your user id as <span className="font-mono">scopeId</span>,
        and <span className="font-mono">totalBudget</span>.
      </p>

      {latest && Object.keys(latest.byType).length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-sm font-semibold text-white">Allocation by bucket (latest plan)</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(latest.byType).map(([type, amt]) => (
              <div key={type} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2">
                <div className="text-[10px] uppercase tracking-wide text-[#737373]">{type}</div>
                <div className="font-mono text-lg text-white">{currency(amt)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {latest ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-xs text-[#737373]">Total budget</div>
            <div className="text-2xl font-bold text-white">{currency(latest.totalBudget)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-xs text-[#737373]">Allocatable</div>
            <div className="text-2xl font-bold text-white">{currency(latest.allocatableBudget)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-xs text-[#737373]">Reserve</div>
            <div className="text-2xl font-bold text-white">{currency(latest.reserveBudget)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-xs text-[#737373]">Plan status</div>
            <div className="text-2xl font-bold text-white">{latest.status}</div>
          </div>
        </section>
      ) : null}

      <CapitalAllocatorV2Client locale={locale} country={country} />

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Recent capital plans</h2>
        {plans.length === 0 ? (
          <p className="mt-3 text-sm text-[#737373]">No plans yet.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-white">
                    {plan.periodLabel ?? "custom"} · {plan.status}
                  </div>
                  <div className="text-xs text-[#737373]">{plan.createdAt.toISOString().slice(0, 10)}</div>
                </div>
                <div className="mt-1 text-sm text-[#B3B3B3]">
                  Budget {currency(plan.totalBudget)} · {plan.items.length} line(s)
                </div>

                <div className="mt-4 space-y-2">
                  {[...plan.items]
                    .sort((a, b) => Number(b.allocatedAmount) - Number(a.allocatedAmount))
                    .slice(0, 8)
                    .map((item) => {
                      const metrics = item.metricsJson as { listingTitle?: string } | null;
                      const title = metrics?.listingTitle ?? item.listingId.slice(0, 8);
                      return (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-[#B3B3B3]">
                          <div className="font-medium text-white">
                            {title} · {item.allocationType}
                          </div>
                          <div>Allocated: {currency(item.allocatedAmount)}</div>
                          <div>Priority: {item.priorityScore}</div>
                          <div>Expected impact: {item.expectedImpactScore}</div>
                          <div>Confidence: {Math.round(Number(item.confidenceScore || 0) * 100)}%</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
