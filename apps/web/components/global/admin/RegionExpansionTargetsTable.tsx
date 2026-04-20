export function RegionExpansionTargetsTable({
  targets,
}: {
  targets: Array<{ regionCode: string; rationale: string }>;
}) {
  const rows = [...targets].sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black">
      <table className="min-w-full text-left text-sm text-zinc-200">
        <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Rationale</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.regionCode} className="border-b border-zinc-900">
              <td className="px-3 py-2 font-medium text-amber-100">{r.regionCode}</td>
              <td className="px-3 py-2 text-xs text-zinc-400">{r.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
