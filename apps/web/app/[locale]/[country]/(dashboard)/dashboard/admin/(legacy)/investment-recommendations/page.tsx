import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

function labelColor(type: string) {
  if (type === "buy") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  if (type === "sell") return "bg-red-500/15 text-red-300 border border-red-500/30";
  if (type === "optimize") return "bg-amber-500/15 text-amber-200 border border-amber-500/30";
  if (type === "hold") return "bg-sky-500/15 text-sky-200 border border-sky-500/30";
  return "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30";
}

export default async function AdminInvestmentRecommendationsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/investment-recommendations`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const rows = await prisma.investmentRecommendation.findMany({
    where: {
      scopeType: "listing",
      status: "active",
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          BNHub · deterministic
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">AI investment recommendations</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
          Rules-based signals from BNHub booking and snapshot metrics — not predictive AI, not guaranteed returns, not legal or tax
          advice. Labels are operational inference only.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link
            href={`/${locale}/${country}/dashboard/admin/investment-recommendations/summary`}
            className="font-medium text-premium-gold hover:underline"
          >
            Portfolio summary →
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-sm text-[#737373]">
            No active recommendations yet. POST{" "}
            <code className="text-premium-gold">/api/investment/recommendations/generate</code> as admin or schedule{" "}
            <code className="text-premium-gold">/api/investment/recommendations/refresh</code> with secret.
          </div>
        ) : null}

        {rows.map((row) => {
          const reasons = Array.isArray(row.reasonsJson) ? (row.reasonsJson as { label: string; message: string }[]) : [];
          const risks = Array.isArray(row.risksJson) ? (row.risksJson as { severity: string; message: string }[]) : [];
          const actions = Array.isArray(row.actionsJson) ? (row.actionsJson as { priority: string; message: string }[]) : [];
          const metrics = (row.metricsJson || {}) as Record<string, unknown>;

          return (
            <div key={row.id} className="space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#737373]">
                    Listing ID: <span className="font-mono text-[#B3B3B3]">{row.scopeId}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${labelColor(row.recommendation)}`}>
                      {row.recommendation}
                    </span>
                    <span className="text-sm text-white">Score: {row.score}</span>
                    <span className="text-sm text-[#B3B3B3]">
                      Confidence: {Math.round(Number(row.confidenceScore || 0) * 100)}%
                    </span>
                  </div>
                  {typeof metrics.listingTitle === "string" ? (
                    <p className="mt-2 text-sm text-[#B3B3B3]">{metrics.listingTitle}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={`/api/investment/recommendations/${row.id}/dismiss`} method="POST">
                    <button
                      type="submit"
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/5"
                    >
                      Dismiss
                    </button>
                  </form>
                  <form action={`/api/investment/recommendations/${row.id}/apply`} method="POST">
                    <button
                      type="submit"
                      className="rounded-lg border border-premium-gold/40 px-3 py-1.5 text-xs text-premium-gold hover:bg-premium-gold/10"
                    >
                      Mark applied
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                <div className="text-[#737373]">
                  Revenue (window): <span className="text-white">{String(metrics.grossRevenue ?? 0)}</span>
                </div>
                <div className="text-[#737373]">
                  Occupancy:{" "}
                  <span className="text-white">{Math.round(Number(metrics.occupancyRate ?? 0) * 100)}%</span>
                </div>
                <div className="text-[#737373]">
                  ADR: <span className="text-white">{String(metrics.adr ?? 0)}</span>
                </div>
                <div className="text-[#737373]">
                  RevPAR: <span className="text-white">{String(metrics.revpar ?? 0)}</span>
                </div>
                <div className="text-[#737373]">
                  Bookings: <span className="text-white">{String(metrics.bookingCount ?? 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-white">Signals</h2>
                  <div className="space-y-2 text-sm">
                    {reasons.map((reason, index) => (
                      <div key={index} className="rounded-lg border border-white/10 bg-black/40 p-3">
                        <div className="font-medium text-white">{reason.label}</div>
                        <div className="mt-1 text-[#B3B3B3]">{reason.message}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-white">Risks</h2>
                  <div className="space-y-2 text-sm">
                    {risks.length ? (
                      risks.map((risk, index) => (
                        <div key={index} className="rounded-lg border border-white/10 bg-black/40 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">{risk.severity}</div>
                          <div className="mt-1 text-[#B3B3B3]">{risk.message}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-[#737373]">No additional risks flagged.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-white">Actions</h2>
                  <div className="space-y-2 text-sm">
                    {actions.map((action, index) => (
                      <div key={index} className="rounded-lg border border-white/10 bg-black/40 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{action.priority}</div>
                        <div className="mt-1 text-[#B3B3B3]">{action.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
