type Column = { id: string; label: string };

type Row = {
  label: string;
  /** Value per column id: true = check, false = —, string = text */
  cells: Record<string, boolean | string>;
};

type PricingComparisonTableProps = {
  columns: Column[];
  rows: Row[];
  className?: string;
};

export function PricingComparisonTable({ columns, rows, className = "" }: PricingComparisonTableProps) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-white/10 ${className}`}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-4 py-4 font-medium text-slate-300">Feature</th>
            {columns.map((c) => (
              <th key={c.id} className="px-4 py-4 font-semibold text-premium-gold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3.5 text-slate-300">{row.label}</td>
              {columns.map((c) => (
                <td key={c.id} className="px-4 py-3.5 text-slate-400">
                  <Cell v={row.cells[c.id]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ v }: { v: boolean | string | undefined }) {
  if (v === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        ✓
      </span>
    );
  }
  if (v === false || v === undefined) {
    return <span className="text-slate-600">—</span>;
  }
  return <span className="text-slate-300">{v}</span>;
}
