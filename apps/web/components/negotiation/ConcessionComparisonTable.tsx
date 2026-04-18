"use client";

export function ConcessionComparisonTable({ rows }: { rows: { label: string; pp?: string; cp?: string }[] }) {
  return (
    <table className="w-full text-left text-[11px] text-zinc-400">
      <thead>
        <tr className="border-b border-white/10">
          <th className="py-1">Field</th>
          <th className="py-1">PP</th>
          <th className="py-1">CP</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-white/5">
            <td className="py-1 text-zinc-300">{r.label}</td>
            <td className="py-1">{r.pp ?? "—"}</td>
            <td className="py-1">{r.cp ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
