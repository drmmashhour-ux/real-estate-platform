import type { WorkspaceQueueItemDto } from "@/lib/trustgraph/domain/workspaces";

export function WorkspaceQueueTable({ items }: { items: WorkspaceQueueItemDto[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No items in this queue.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="py-2 pr-4">Case</th>
            <th className="py-2 pr-4">Entity</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Trust</th>
            <th className="py-2 pr-4">Readiness</th>
            <th className="py-2">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.caseId} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2 pr-4 font-mono text-xs">{row.caseId.slice(0, 8)}…</td>
              <td className="py-2 pr-4">
                {row.entityType} / {row.entityId.slice(0, 8)}…
              </td>
              <td className="py-2 pr-4">{row.status}</td>
              <td className="py-2 pr-4">{row.trustLevel ?? "—"}</td>
              <td className="py-2 pr-4">{row.readinessLevel ?? "—"}</td>
              <td className="py-2">{row.dueAt ? new Date(row.dueAt).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
