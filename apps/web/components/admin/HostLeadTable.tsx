import type { HostLeadRowView } from "@/types/host-lead-client";

export function HostLeadTable({ rows }: { rows: Pick<HostLeadRowView, "id" | "email" | "phone" | "funnelStatus" | "source" | "city" | "createdAt">[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No host leads yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-sm text-zinc-200">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">City</th>
            <th className="px-3 py-2">Contact</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 font-mono text-xs">{r.funnelStatus}</td>
              <td className="px-3 py-2">{r.source}</td>
              <td className="px-3 py-2">{r.city ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-zinc-400">
                {r.email ?? "—"} {r.phone ? `· ${r.phone}` : ""}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-500">{r.createdAt.toISOString().slice(0, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
