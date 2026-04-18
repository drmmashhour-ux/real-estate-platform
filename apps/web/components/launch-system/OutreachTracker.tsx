type Row = {
  id: string;
  name: string | null;
  contact: string;
  type: string;
  source: string;
  status: string;
  market: string | null;
  createdAt: Date;
};

export function OutreachTracker({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-sm text-zinc-300">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="px-3 py-2 font-medium text-zinc-500">Contact</th>
            <th className="px-3 py-2 font-medium text-zinc-500">Source</th>
            <th className="px-3 py-2 font-medium text-zinc-500">Status</th>
            <th className="px-3 py-2 font-medium text-zinc-500">Market</th>
            <th className="px-3 py-2 font-medium text-zinc-500">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 text-zinc-100">
                {r.name ?? "—"} <span className="text-zinc-500">· {r.contact}</span>
              </td>
              <td className="px-3 py-2">{r.source}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2">{r.market ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-zinc-500">{r.createdAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
