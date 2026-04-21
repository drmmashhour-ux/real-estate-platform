"use client";

type Row = {
  id: string;
  status: string;
  domain: string;
  actionType: string;
  riskLevel: string;
  autonomyMode: string;
  createdAt: string;
  rationale: string | null;
};

export function AutonomyQueueTable({
  items,
  onSelect,
}: {
  items: Row[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-xs text-slate-300">
        <thead className="bg-black/40 text-[10px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Domain</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">Mode</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr
              key={r.id}
              className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
              onClick={() => onSelect(r.id)}
            >
              <td className="px-3 py-2 font-mono text-[10px] text-slate-200">{r.status}</td>
              <td className="px-3 py-2">{r.domain}</td>
              <td className="px-3 py-2">{r.actionType}</td>
              <td className="px-3 py-2">{r.riskLevel}</td>
              <td className="px-3 py-2">{r.autonomyMode}</td>
              <td className="px-3 py-2 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
