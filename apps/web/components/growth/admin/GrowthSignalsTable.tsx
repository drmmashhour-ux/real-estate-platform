import type { GrowthSignal } from "@/modules/growth-intelligence/growth.types";

export function GrowthSignalsTable(props: { signals: GrowthSignal[] }) {
  if (!props.signals.length) {
    return <p className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-500">No signals this run.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-xs">
        <thead className="bg-black/40 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Title</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-zinc-200">
          {props.signals.slice(0, 40).map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2 font-mono text-[10px] text-premium-gold/90">{s.signalType}</td>
              <td className="px-3 py-2">{s.severity}</td>
              <td className="px-3 py-2">{s.region ?? "—"}</td>
              <td className="px-3 py-2 text-zinc-300">{s.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
