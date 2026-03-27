import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { DecisionEngineResult, PriorityLevel } from "@/modules/ai/decision-engine/decision-types";

const DISCLAIMER =
  "AI provides guidance only. Final decisions remain with the user. The platform does not auto-execute payments, payouts, contracts, or listing publication.";

function priorityStyles(level: PriorityLevel): { bar: string; badge: string; label: string } {
  switch (level) {
    case "critical":
      return {
        bar: "bg-gradient-to-b from-red-500 to-red-700",
        badge: "bg-red-500/20 text-red-200 ring-1 ring-red-500/40",
        label: "Critical",
      };
    case "high":
      return {
        bar: "bg-gradient-to-b from-amber-500 to-amber-700",
        badge: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35",
        label: "High",
      };
    case "medium":
      return {
        bar: "bg-gradient-to-b from-sky-500 to-sky-700",
        badge: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/30",
        label: "Medium",
      };
    default:
      return {
        bar: "bg-gradient-to-b from-slate-500 to-slate-700",
        badge: "bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/25",
        label: "Low",
      };
  }
}

function notificationHint(level: PriorityLevel): string {
  switch (level) {
    case "critical":
      return "Immediate alert — review now.";
    case "high":
      return "Dashboard highlight — act today.";
    case "medium":
      return "Subtle reminder — schedule when convenient.";
    default:
      return "Suggestion — optional optimization.";
  }
}

export type DecisionCardProps = {
  title?: string;
  result: DecisionEngineResult;
  /** Primary CTA (e.g. listing or task). */
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function DecisionCard({
  title = "AI decision assist",
  result,
  actionHref,
  actionLabel = "Take next step",
  className = "",
}: DecisionCardProps) {
  const ps = priorityStyles(result.priorityLevel);

  return (
    <section
      className={`group relative overflow-hidden rounded-xl border-2 border-[#C9A646]/55 bg-[#111111] p-6 shadow-lg transition-all duration-300 ease-out hover:border-[#C9A646]/80 hover:shadow-xl motion-safe:hover:scale-[1.005] ${className}`}
      data-ai-priority={result.priorityLevel}
      data-ai-notification={notificationHint(result.priorityLevel)}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 start-0 w-1 rounded-s-[inherit] ${ps.bar}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-[#C9A646]/[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A646]/35 bg-[#C9A646]/12 text-[#C9A646] shadow-[0_0_24px_rgba(201,166,70,0.15)]">
            <Sparkles className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C9A646]/90">{title}</p>
            <h2 className="mt-2 font-serif text-xl font-semibold leading-snug tracking-tight text-white">
              {result.summary}
            </h2>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ps.badge}`}>
          {ps.label} priority
        </span>
      </div>

      <p className="relative mt-3 text-sm text-premium-secondary">{notificationHint(result.priorityLevel)}</p>

      {result.risks.length > 0 ? (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {result.risks.slice(0, 6).map((r) => (
            <li
              key={`${r.type}-${r.severity}`}
              className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5 text-[11px] text-slate-200 ring-1 ring-white/5"
              title={r.explanation}
            >
              <span className="font-medium text-white">{r.type.replace(/_/g, " ")}</span>
              <span className="text-premium-secondary"> · </span>
              <span className="uppercase text-premium-secondary">{r.severity}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-6 rounded-xl border border-[#C9A646]/25 bg-black/25 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]/85">Next best action</p>
        <p className="mt-2 text-sm leading-relaxed text-white/95">{result.nextBestAction}</p>
        {actionHref ? (
          <Link href={actionHref} className="btn-primary mt-4 inline-flex min-h-0 px-5 py-2.5 text-sm">
            {actionLabel}
          </Link>
        ) : null}
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
        {result.recommendations.slice(0, 4).map((rec) => (
          <div
            key={rec.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition-colors duration-200 hover:border-[#C9A646]/20"
          >
            <p className="font-medium text-white">{rec.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-premium-secondary">{rec.detail}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-6 flex flex-wrap items-start justify-between gap-3 border-t border-white/10 pt-4 text-xs text-premium-secondary">
        <span>
          Confidence <span className="font-semibold text-white">{result.confidenceScore}%</span>
        </span>
        <span className="max-w-prose text-right leading-relaxed">{result.reasoning}</span>
      </div>

      <p className="relative mt-4 text-[11px] leading-relaxed text-premium-secondary/90">{DISCLAIMER}</p>
    </section>
  );
}
