import type { LegalWorkflowCardModel } from "@/modules/legal/legal-view-model.service";

export function LegalWorkflowCard({ card }: { card: LegalWorkflowCardModel }) {
  return (
    <article className="rounded-2xl border border-premium-gold/20 bg-black/45 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{card.title}</h3>
          <p className="mt-1 text-xs text-[#9CA3AF]">{card.shortDescription}</p>
        </div>
        {card.reviewBadge ? (
          <span className="rounded-full border border-premium-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
            Review may apply
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#1f1f1f]" role="progressbar" aria-valuenow={card.completionPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-premium-gold/80 to-premium-gold"
            style={{ width: `${Math.min(100, Math.max(0, card.completionPercent))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#737373]">{card.completionPercent}% complete</p>
      </div>
      {card.nextAction ? (
        <p className="mt-3 text-xs text-[#B3B3B3]">
          <span className="font-medium text-white/90">Next: </span>
          {card.nextAction}
        </p>
      ) : null}
    </article>
  );
}
