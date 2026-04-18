type Row = { label: string; lecipm: string; notes: string };

export function ComparisonTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full min-w-[520px] text-left text-sm text-slate-300">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80">
            <th className="px-4 py-3 font-medium text-slate-400">Topic</th>
            <th className="px-4 py-3 font-medium text-emerald-300/90">LECIPM</th>
            <th className="px-4 py-3 font-medium text-slate-500">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-800/80">
              <td className="px-4 py-3 text-white">{r.label}</td>
              <td className="px-4 py-3">{r.lecipm}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
