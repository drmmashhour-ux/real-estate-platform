import type { DealReviewSurfacePayload } from "@/modules/qa-review/review-surface.service";

type Visible = Extract<DealReviewSurfacePayload, { visible: true }>;

export function ReviewRequiredBanner({ qaSummary }: { qaSummary: Visible["qaSummary"] }) {
  const needsAttention = qaSummary.reviews.some(
    (r) =>
      r.status === "pending" ||
      r.status === "in_progress" ||
      r.outcome === "changes_required" ||
      r.outcome === "escalated",
  );
  if (!needsAttention) return null;
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
      <p className="font-semibold text-amber-200">Brokerage QA / compliance attention</p>
      <p className="mt-1 text-amber-100/85">
        A supervisory review may be in progress or changes may be required before you proceed. Coordinate with your
        brokerage per internal policy.
      </p>
    </div>
  );
}
