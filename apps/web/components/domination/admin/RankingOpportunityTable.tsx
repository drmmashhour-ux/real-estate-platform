import type { RankingOpportunity } from "@/modules/market-domination/market-domination.types";

export function RankingOpportunityTable(props: { rows: RankingOpportunity[] }) {
  if (!props.rows.length) {
    return <p className="text-sm text-slate-500">No deterministic ranking opportunities surfaced.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full text-left text-sm text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Priority</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-800/80">
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
