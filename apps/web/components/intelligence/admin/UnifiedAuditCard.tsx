export function UnifiedAuditCard(props: { auditSummary?: Record<string, unknown>; freshness: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Audit snapshot</p>
      <p className="mt-2 text-xs text-slate-600">
        Aggregated pointers only — cross-check execution audit logs and event timeline for full accountability.
      </p>
      <pre className="mt-4 max-h-40 overflow-auto text-[11px] text-slate-400">
        {props.auditSummary && Object.keys(props.auditSummary).length > 0
          ? JSON.stringify(props.auditSummary, null, 2)
          : "{}"}
      </pre>
      <p className="mt-3 text-[10px] text-slate-600">Facet freshness: {props.freshness}</p>
    </div>
  );
}
