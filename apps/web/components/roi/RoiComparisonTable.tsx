"use client";

type Row = { label: string; current: string; lecipm: string };

export function RoiComparisonTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3"> </th>
            <th className="px-4 py-3">Current (modeled)</th>
            <th className="px-4 py-3">LECIPM (modeled)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/10">
              <td className="px-4 py-3 text-slate-300">{r.label}</td>
              <td className="px-4 py-3 text-white">{r.current}</td>
              <td className="px-4 py-3 text-premium-gold">{r.lecipm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
