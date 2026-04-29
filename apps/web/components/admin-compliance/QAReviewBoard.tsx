import type { QaReviewView } from "@/types/compliance-cases-client";

type ReviewRow = QaReviewView & {
  deal: { id: string; dealCode: string | null; brokerId: string | null } | null;
};

export function QAReviewBoard({ reviews }: { reviews: ReviewRow[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">QA reviews</h2>
      <div className="max-h-[420px] overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Outcome</th>
              <th className="px-3 py-2">Deal</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  No reviews yet.
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2.5 text-zinc-200">{r.reviewType.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{r.status}</td>
                  <td className="px-3 py-2.5 text-amber-200/90">{r.outcome ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{r.deal?.dealCode ?? r.dealId ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-zinc-500">{r.updatedAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
