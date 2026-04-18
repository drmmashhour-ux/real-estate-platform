"use client";

type Row = {
  domain: string;
  qualityScore?: number | null;
  priorityBucket?: string | null;
  status: string;
};

/**
 * Per-domain rollups for the unified queue (client-side from loaded actions).
 */
export function AutopilotDomainSummary(props: { actions: Row[] }) {
  const map = new Map<string, { n: number; sumQ: number; qN: number; urgent: number; active: number }>();
  const stale = new Set(["archived", "expired", "rejected"]);

  for (const a of props.actions) {
    const cur = map.get(a.domain) ?? { n: 0, sumQ: 0, qN: 0, urgent: 0, active: 0 };
    cur.n += 1;
    if (typeof a.qualityScore === "number") {
      cur.sumQ += a.qualityScore;
      cur.qN += 1;
    }
    if (a.priorityBucket === "DO_NOW") cur.urgent += 1;
    if (!stale.has(a.status)) cur.active += 1;
    map.set(a.domain, cur);
  }

  const rows = [...map.entries()].sort((x, y) => y[1].n - x[1].n);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">By domain</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <th className="pb-2 pr-4 font-medium">Domain</th>
              <th className="pb-2 pr-4 font-medium">Items</th>
              <th className="pb-2 pr-4 font-medium">Active</th>
              <th className="pb-2 pr-4 font-medium">Avg Q</th>
              <th className="pb-2 font-medium">Do now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([domain, v]) => (
              <tr key={domain} className="border-b border-zinc-800/80">
                <td className="py-2 pr-4 font-mono text-xs text-emerald-300/90">{domain}</td>
                <td className="py-2 pr-4">{v.n}</td>
                <td className="py-2 pr-4">{v.active}</td>
                <td className="py-2 pr-4">{v.qN ? Math.round(v.sumQ / v.qN) : "—"}</td>
                <td className="py-2">{v.urgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
