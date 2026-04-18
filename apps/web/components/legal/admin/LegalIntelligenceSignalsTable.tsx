import type { LegalIntelligenceSignal } from "@/modules/legal/legal-intelligence.types";

export function LegalIntelligenceSignalsTable({ signals }: { signals: LegalIntelligenceSignal[] }) {
  if (!signals.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-slate-500">No signals for this scope.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-slate-800 text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">Severity</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Explanation</th>
          </tr>
        </thead>
        <tbody>
          {signals.slice(0, 40).map((s) => (
            <tr key={s.id} className="border-b border-slate-800/80">
              <td className="px-3 py-2 font-mono text-[10px] uppercase text-premium-gold">{s.severity}</td>
              <td className="px-3 py-2 text-slate-300">{s.signalType}</td>
              <td className="px-3 py-2 text-slate-400">{s.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
