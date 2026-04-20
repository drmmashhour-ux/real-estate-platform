import { requireInvestorUser } from "@/lib/auth/require-investor";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import { getInvestorDashboard } from "@/modules/investor/investor-data.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

function formatMoney(currencyCode: string, value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode.length === 3 ? currencyCode : "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercentRatio(r: number) {
  return `${Math.round(Math.min(1, Math.max(0, r)) * 100)}%`;
}

function parseRowMeta(meta: unknown) {
  if (!meta || typeof meta !== "object") {
    return { revenue: 0, bookings: 0, occupancyRate: undefined as number | undefined, adr: undefined as number | undefined, revpar: undefined as number | undefined };
  }
  const m = meta as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" ? v : Number(v)) || 0;
  return {
    revenue: n(m.revenue),
    bookings: Math.round(n(m.bookings)),
    occupancyRate: m.occupancyRate !== undefined ? n(m.occupancyRate) : undefined,
    adr: m.adr !== undefined ? n(m.adr) : undefined,
    revpar: m.revpar !== undefined ? n(m.revpar) : undefined,
  };
}

export default async function InvestorBnhubReportsPage() {
  const { email } = await requireInvestorUser();
  const access = await getInvestorByEmail(email);

  if (!access?.isActive) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-8 text-slate-300">
        <h1 className="text-lg font-semibold text-white">BNHub reports</h1>
        <p className="mt-2 text-sm text-slate-400">
          No BNHub portfolio access is linked to this account. Your email must be allowlisted in{" "}
          <code className="text-amber-200/90">InvestorAccess</code> (active) to view host metrics and delivery history.
        </p>
      </div>
    );
  }

  const data = await getInvestorDashboard(email);
  const p = data.summary.portfolio;
  const cur = p.displayCurrency ?? "USD";
  const historyChron = [...data.reports].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">BNHub investor reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generated from BNHub analytics — live KPIs match the host revenue engine; historical rows use snapshot KPIs stored at
          delivery time.
        </p>
        {access.name ? (
          <p className="mt-2 text-sm text-slate-400">
            Welcome, <span className="text-slate-200">{access.name}</span>
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Portfolio overview</h2>
        <p className="mt-1 text-xs text-slate-500">Last 30 UTC days (check-in window), same definitions as BNHub host dashboard.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Gross revenue" value={formatMoney(cur, p.grossRevenue)} accent />
          <Kpi label="Bookings" value={String(p.bookingCount)} />
          <Kpi label="Occupancy" value={formatPercentRatio(p.occupancyRate)} />
          <Kpi label="ADR" value={formatMoney(cur, p.adr)} />
          <Kpi label="RevPAR" value={formatMoney(cur, p.revpar)} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Executive narrative</h2>
        <p className="mt-1 text-xs text-slate-500">Rules-based summary — not predictive AI.</p>
        <div className="mt-4 space-y-3">
          <p className="text-lg font-semibold text-slate-100">{data.narrative.headline}</p>
          <p className="text-sm leading-relaxed text-slate-400">{data.narrative.overview}</p>
          <p className="text-sm text-slate-500">{data.narrative.closing}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Performance over time</h2>
        <p className="mt-1 text-xs text-slate-500">
          Points from scheduled / delivered reports (meta captured at send). More deliveries yield a richer curve.
        </p>
        {historyChron.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No historical snapshots yet. Values will appear after the first successful scheduled report delivery for this scope.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Revenue (snapshot)</th>
                  <th className="py-2 pr-4 font-medium">Bookings</th>
                  <th className="py-2 pr-4 font-medium">Occ.</th>
                  <th className="py-2 pr-4 font-medium">ADR</th>
                  <th className="py-2 font-medium">RevPAR</th>
                </tr>
              </thead>
              <tbody>
                {historyChron.map((r) => {
                  const m = parseRowMeta(r.meta);
                  return (
                    <tr key={r.id} className="border-b border-white/5 text-slate-300">
                      <td className="py-2 pr-4 tabular-nums text-slate-400">{r.createdAt.toISOString().slice(0, 10)}</td>
                      <td className="py-2 pr-4 tabular-nums">{formatMoney(cur, m.revenue)}</td>
                      <td className="py-2 pr-4 tabular-nums">{m.bookings}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {m.occupancyRate !== undefined ? formatPercentRatio(m.occupancyRate) : "—"}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{m.adr !== undefined ? formatMoney(cur, m.adr) : "—"}</td>
                      <td className="py-2 tabular-nums">{m.revpar !== undefined ? formatMoney(cur, m.revpar) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Historical reports</h2>
        <p className="mt-1 text-xs text-slate-500">Delivered BNHub PDFs stored for this scope (download uses your session).</p>

        {data.reports.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No reports available yet. Reports will appear after the first scheduled delivery (or when an operator archives a PDF for
            this investor scope).
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {data.reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="text-slate-400">
                  <span className="tabular-nums text-slate-300">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</span>
                  {r.channel ? (
                    <span className="ml-2 rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-slate-500">{r.channel}</span>
                  ) : null}
                </div>
                {r.hasPdf ? (
                  <a
                    href={`/api/investor/report/download?id=${encodeURIComponent(r.id)}`}
                    className="font-medium text-premium-gold hover:underline"
                  >
                    Download PDF
                  </a>
                ) : (
                  <span className="text-xs text-slate-600">Delivery record (no file stored)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white" style={accent ? { color: GOLD } : undefined}>
        {value}
      </p>
    </div>
  );
}
