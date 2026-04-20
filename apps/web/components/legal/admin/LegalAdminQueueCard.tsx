import type { LegalAdminReviewQueueItem } from "@/modules/legal/legal-admin-review.service";

export function LegalAdminQueueCard({ items }: { items: LegalAdminReviewQueueItem[] }) {
  return (
    <section className="rounded-xl border border-premium-gold/25 bg-black/40 p-4" aria-labelledby="legal-admin-queue-heading">
      <h3 id="legal-admin-queue-heading" className="text-xs font-semibold uppercase tracking-wide text-premium-gold">
        Legal review queue
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-[#737373]">No aggregated items.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.workflowKey + it.label} className="flex items-center justify-between gap-2 text-xs text-[#E5E5E5]">
              <span>{it.label}</span>
              <span className="font-mono text-premium-gold">{it.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
