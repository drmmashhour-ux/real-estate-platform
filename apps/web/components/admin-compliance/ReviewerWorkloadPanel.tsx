import type { QaReviewView } from "@/types/compliance-cases-client";

type ReviewRow = QaReviewView & {
  deal: { id: string; dealCode: string | null; brokerId: string | null } | null;
};

export function ReviewerWorkloadPanel({ reviews }: { reviews: ReviewRow[] }) {
  const map = new Map<string, number>();
  for (const r of reviews) {
    if (!r.assignedToUserId) continue;
    if (r.status !== "pending" && r.status !== "in_progress") continue;
    map.set(r.assignedToUserId, (map.get(r.assignedToUserId) ?? 0) + 1);
  }
  const rows = [...map.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Reviewer load (in-flight)</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No assigned in-progress reviews in the current window.</p>
      ) : (
        <ul className="mt-3 space-y-2 font-mono text-xs">
          {rows.map((x) => (
            <li key={x.id} className="flex justify-between text-zinc-300">
              <span className="truncate">{x.id}</span>
              <span className="text-amber-200/90">{x.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
