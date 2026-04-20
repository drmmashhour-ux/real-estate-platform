export function LegalAdminRisksTable({
  rows,
}: {
  rows: { label: string; value: string | number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-premium-gold/20 bg-black/35">
      <table className="min-w-full text-left text-xs text-[#E5E5E5]">
        <thead className="border-b border-premium-gold/20 bg-black/50 text-[10px] uppercase tracking-wide text-premium-gold">
          <tr>
            <th className="px-3 py-2 font-semibold">Metric</th>
            <th className="px-3 py-2 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-white/5">
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2 font-mono text-premium-gold">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
