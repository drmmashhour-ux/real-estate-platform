import { requireInvestorUser } from "@/lib/auth/require-investor";
import { InvestmentRecommendationRowActions } from "@/components/investor/InvestmentRecommendationRowActions";
import { loadBnhubInvestorRecommendationsView } from "@/modules/investment/investor-recommendations-view.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

function labelStyle(type: string) {
  if (type === "buy") return "bg-emerald-950/60 text-emerald-200 border-emerald-800/50";
  if (type === "sell") return "bg-red-950/50 text-red-200 border-red-900/40";
  if (type === "optimize") return "bg-amber-950/50 text-amber-200 border-amber-800/40";
  if (type === "hold") return "bg-sky-950/50 text-sky-200 border-sky-800/40";
  return "bg-white/5 text-slate-300 border-white/10";
}

export default async function InvestorBnhubRecommendationsPage() {
  const { email, userId } = await requireInvestorUser();
  const data = await loadBnhubInvestorRecommendationsView(email, { userId });

  if (!data.ok) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-8 text-slate-300">
        <h1 className="text-lg font-semibold text-white">Investment recommendations</h1>
        <p className="mt-2 text-sm text-slate-400">
          Connect an active BNHub investor allowlist row (<code className="text-amber-200/90">InvestorAccess</code>) to this
          account to view deterministic stance signals for stays linked to your host scope.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          AI Investment Recommendations
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">BNHub deterministic signals</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Generated from BNHub operating metrics (bookings, occupancy, RevPAR, recorded costs). Outputs are{" "}
          <strong className="text-slate-300">signals only</strong> — not forecasts, not guaranteed returns, and not
          personalized financial advice. Every row is traceable to dashboard-grade inputs stored on the platform.
        </p>
      </div>

      {data.listingIds.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
          No BNHub stays are linked to this investor scope yet (host inventory empty).
        </p>
      ) : data.recommendations.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
          No active recommendations yet. Run an admin batch generate (
          <code className="text-slate-400">POST /api/investment/recommendations/generate</code>) or the secured refresh job
          after stays have <span className="text-slate-400">investment analytics</span> enabled.
        </p>
      ) : (
        <div className="space-y-6">
          {data.recommendations.map((row) => {
            const reasons = Array.isArray(row.reasonsJson) ? row.reasonsJson : [];
            const risks = Array.isArray(row.risksJson) ? row.risksJson : [];
            const actions = Array.isArray(row.actionsJson) ? row.actionsJson : [];
            const metrics = (row.metricsJson || {}) as Record<string, unknown>;

            return (
              <article key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Stay listing</p>
                    <p className="font-mono text-sm text-slate-400">{row.scopeId}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase ${labelStyle(row.recommendation)}`}
                      >
                        {row.recommendation}
                      </span>
                      <span className="text-sm tabular-nums text-slate-300">Score {row.score}</span>
                      <span className="text-sm tabular-nums text-slate-400">
                        Confidence {Math.round(Number(row.confidenceScore || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <InvestmentRecommendationRowActions recommendationId={row.id} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                  <Metric label="Revenue (window)" value={fmtNum(metrics.grossRevenue)} />
                  <Metric label="Occupancy" value={pct(metrics.occupancyRate)} />
                  <Metric label="ADR" value={fmtNum(metrics.adr)} />
                  <Metric label="RevPAR" value={fmtNum(metrics.revpar)} />
                  <Metric label="Bookings" value={String(metrics.bookingCount ?? 0)} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <SignalBlock title="Signals" items={reasons as { label?: string; message?: string }[]} />
                  <SignalBlock title="Risks" items={risks as { severity?: string; message?: string }[]} risk />
                  <SignalBlock title="Suggested actions" items={actions as { priority?: string; message?: string }[]} action />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

function fmtNum(v: unknown) {
  if (typeof v === "number") return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return "—";
}

function pct(v: unknown) {
  if (typeof v === "number") return `${Math.round(Math.min(1, Math.max(0, v)) * 100)}%`;
  return "—";
}

function SignalBlock({
  title,
  items,
  risk,
  action,
}: {
  title: string;
  items: Record<string, unknown>[];
  risk?: boolean;
  action?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      <div className="space-y-2">
        {!items.length ? (
          <p className="text-sm text-slate-500">{risk ? "No major risks flagged." : "—"}</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
              {risk ? (
                <p className="text-[10px] font-semibold uppercase text-amber-200/90">{String(item.severity ?? "")}</p>
              ) : null}
              {action ? (
                <p className="text-[10px] font-semibold uppercase text-slate-400">{String(item.priority ?? "")}</p>
              ) : null}
              {!risk && !action ? <p className="text-xs font-medium text-premium-gold">{String(item.label ?? "")}</p> : null}
              <p className="mt-1 text-slate-400">{String(item.message ?? "")}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
