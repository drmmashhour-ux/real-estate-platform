import type { HostReputationResult } from "@/lib/ai/reputation/reputation-types";
import { hostReputationTierLabel } from "@/lib/ai/reputation/reputation-engine";

export function HostReputationScore({ data }: { data: HostReputationResult }) {
  const tierLabel = hostReputationTierLabel(data.tier);
  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-violet-300/90">Host performance score</p>
      <p className="mt-1 text-sm text-slate-400">
        Based on real bookings, guest messages, reviews, checklists, and disputes — not used to hide your listings.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-4xl font-semibold tabular-nums text-white">{Math.round(data.score)}</p>
          <p className="text-xs text-slate-500">out of 100</p>
        </div>
        <div className="rounded-full border border-violet-400/40 bg-violet-950/50 px-3 py-1 text-sm font-medium text-violet-200">
          {tierLabel}
        </div>
      </div>

      {data.limitedHistory ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Limited booking history — score is partially neutral until more trips complete.
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {data.reasons.slice(0, 3).join(" ")}
      </p>

      {data.improvementSuggestions.length > 0 ? (
        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <p className="text-xs font-medium text-slate-400">Suggestions</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-400">
            {data.improvementSuggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
