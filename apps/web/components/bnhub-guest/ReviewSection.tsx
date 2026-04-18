"use client";

export type ReviewRow = { id: string; rating: number; comment: string | null; createdAt: string };

/** Only renders provided reviews — never synthesizes content. */
export function ReviewSection({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-neutral-500">No guest reviews yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-white/10 p-3">
          <p className="text-sm text-white">★ {r.rating}</p>
          {r.comment && <p className="mt-1 text-sm text-neutral-300">{r.comment}</p>}
          <p className="mt-1 text-xs text-neutral-500">{r.createdAt}</p>
        </li>
      ))}
    </ul>
  );
}
