import type { FutureOutcomeTimelineStep } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

export function TimelinePreview({
  steps,
  compact,
}: {
  steps: FutureOutcomeTimelineStep[];
  compact?: boolean;
}) {
  if (!steps.length) return null;
  return (
    <ol className={`space-y-3 ${compact ? "" : ""}`}>
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 text-[10px] font-bold text-[#C9A646]">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{s.title}</p>
            {!compact ? <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.description}</p> : null}
            {s.typicalDurationHint ? (
              <p className="mt-1 text-[10px] text-slate-500">{s.typicalDurationHint}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
