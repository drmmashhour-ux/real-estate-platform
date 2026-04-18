"use client";

import type { CommandCenterBriefingCard } from "../company-command-center-v4.types";

const SEV: Record<CommandCenterBriefingCard["severity"], string> = {
  info: "border-zinc-700 bg-zinc-900/40",
  watch: "border-amber-900/50 bg-amber-950/20",
  warning: "border-orange-900/50 bg-orange-950/20",
  critical: "border-rose-900/50 bg-rose-950/30",
};

export function BriefingCardsBlock({ cards }: { cards: CommandCenterBriefingCard[] }) {
  if (!cards.length) {
    return <p className="text-xs text-zinc-500">No briefing cards for this window.</p>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.id} className={`rounded-xl border p-4 ${SEV[c.severity]}`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-zinc-100">{c.title}</h3>
            <span className="shrink-0 text-[10px] uppercase text-zinc-500">{c.severity}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">{c.summary}</p>
          {c.systemsInvolved.length > 0 ? (
            <p className="mt-2 text-[10px] text-zinc-500">Systems: {c.systemsInvolved.join(", ")}</p>
          ) : null}
          {c.recommendedFocus ? (
            <p className="mt-2 text-[11px] text-amber-200/80">Focus: {c.recommendedFocus}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
