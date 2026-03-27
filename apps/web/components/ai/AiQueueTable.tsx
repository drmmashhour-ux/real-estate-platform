"use client";

export type QueueItem = {
  id: string;
  type: string;
  entityId: string;
  riskScore: number | null;
  trustScore: number | null;
  status: string;
  recommendedAction: string | null;
  details: unknown;
  createdAt: string;
  updatedAt: string;
};

type AiQueueTableProps = {
  items: QueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

export function AiQueueTable({ items, selectedId, onSelect, loading }: AiQueueTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading queue…</p>
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">Queue is empty. Enqueue listings, bookings, users, or disputes to review.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Entity ID</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Risk</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Trust</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Recommended</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-b border-slate-100 transition-colors dark:border-slate-800/80 ${
                  selectedId === item.id
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {item.entityId.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      item.riskScore != null && item.riskScore >= 70
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                    }
                  >
                    {item.riskScore ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                  {item.trustScore != null ? Number(item.trustScore).toFixed(0) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      item.status === "pending"
                        ? "text-amber-600 dark:text-amber-400"
                        : item.status === "approved"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.status === "rejected"
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-600 dark:text-slate-400"
                    }
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {item.recommendedAction ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
