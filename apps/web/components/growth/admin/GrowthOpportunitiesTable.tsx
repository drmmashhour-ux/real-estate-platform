import type { GrowthOpportunity } from "@/modules/growth-intelligence/growth.types";

export function GrowthOpportunitiesTable(props: { opportunities: GrowthOpportunity[] }) {
  if (!props.opportunities.length) {
    return <p className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-500">No opportunities.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-xs">
        <thead className="bg-black/40 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Title</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-zinc-200">
          {props.opportunities.slice(0, 40).map((o) => (
            <tr key={o.id} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2 font-mono text-[10px] text-premium-gold/90">{o.opportunityType}</td>
              <td className="px-3 py-2">{o.severity}</td>
              <td className="px-3 py-2 text-zinc-300">{o.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
