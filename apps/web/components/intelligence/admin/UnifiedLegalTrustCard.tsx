/** Legal, compliance, and trust facets — advisory JSON slices only (no raw documents). */

function FacetBlock(props: { title: string; payload: Record<string, unknown> | undefined }) {
  if (!props.payload || Object.keys(props.payload).length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.title}</p>
        <p className="mt-2 text-xs text-slate-600">No structured signals.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-800/80 bg-black/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.title}</p>
      <pre className="mt-3 max-h-48 overflow-auto text-[11px] leading-relaxed text-slate-400">
        {JSON.stringify(props.payload, null, 2)}
      </pre>
    </div>
  );
}

export function UnifiedLegalTrustCard(props: {
  compliance?: Record<string, unknown>;
  legalRisk?: Record<string, unknown>;
  trust?: Record<string, unknown>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal &amp; trust</p>
      <div className="grid gap-4 md:grid-cols-3">
        <FacetBlock title="Compliance (pack notes)" payload={props.compliance} />
        <FacetBlock title="Legal risk (advisory)" payload={props.legalRisk} />
        <FacetBlock title="Trust / fraud signals" payload={props.trust} />
      </div>
    </div>
  );
}
