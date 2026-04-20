import type { AuditTimelineRow } from "@/modules/audit/audit-panel.service";

export function AuditTimelineTable({ rows }: { rows: AuditTimelineRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No timeline rows.</p>
    );
  }

  return (
    <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-[11px]">
        <thead className="sticky top-0 border-b border-zinc-800 bg-[#141414] text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.id} className="text-zinc-400">
              <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{r.createdAt}</td>
              <td className="px-3 py-2 font-mono text-amber-200/80">{r.eventType}</td>
              <td className="px-3 py-2">{r.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
