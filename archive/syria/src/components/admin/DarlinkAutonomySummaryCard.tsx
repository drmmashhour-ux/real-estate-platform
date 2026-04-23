/** Dashboard totals — purely presentational. */

type Props = {
  freshness: string;
  totals: {
    signals: number;
    opportunitiesProxy: number;
    actionsExecuted: number;
    actionsDryRunOrBlocked: number;
    pendingApprovals: number;
    auditRows24h: number;
    rollbackEvents30d: number;
  };
};

export function DarlinkAutonomySummaryCard(props: Props) {
  const { freshness, totals } = props;
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-900">Marketplace autonomy snapshot</h3>
        <p className="text-[10px] uppercase tracking-wide text-stone-400">{freshness.slice(0, 16)} UTC</p>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Signals (latest build)" value={totals.signals} />
        <Metric label="Opportunities (proxy)" value={totals.opportunitiesProxy} />
        <Metric label="Executed actions (all-time)" value={totals.actionsExecuted} />
        <Metric label="Dry-run / blocked records" value={totals.actionsDryRunOrBlocked} />
        <Metric label="Pending approvals" value={totals.pendingApprovals} />
        <Metric label="Audit rows (24h)" value={totals.auditRows24h} />
        <Metric label="Rollback events (30d)" value={totals.rollbackEvents30d} />
      </dl>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-stone-900">{value}</dd>
    </div>
  );
}
