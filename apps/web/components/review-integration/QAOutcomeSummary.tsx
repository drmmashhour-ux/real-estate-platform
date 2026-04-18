import type { DealReviewSurfacePayload } from "@/modules/qa-review/review-surface.service";

type Visible = Extract<DealReviewSurfacePayload, { visible: true }>;

export function QAOutcomeSummary({ qaSummary }: { qaSummary: Visible["qaSummary"] }) {
  if (qaSummary.reviews.length === 0) {
    return <p className="text-sm text-zinc-500">No brokerage QA reviews recorded for this deal.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {qaSummary.reviews.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-black/25 px-3 py-2">
          <span className="text-zinc-200">{r.reviewType.replace(/_/g, " ")}</span>
          <span className="text-xs text-zinc-500">
            {r.status}
            {r.outcome ? ` · ${r.outcome}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
