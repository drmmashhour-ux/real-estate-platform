"use client";

import { useEffect, useState } from "react";
import { readActivationFlags } from "@/lib/investment/activation-storage";

type Props = {
  /** Current session: completed analyze */
  analyzed: boolean;
  /** Current session: saved deal */
  saved: boolean;
};

/**
 * Step 1 → 2 → 3 funnel: Analyze ✓ → Save (highlight until done) → Compare / Dashboard
 */
export function ActivationProgressSteps({ analyzed, saved }: Props) {
  const [flags, setFlags] = useState(readActivationFlags);

  useEffect(() => {
    setFlags(readActivationFlags());
  }, [analyzed, saved]);

  const step1Done = analyzed || flags.analyzed;
  const step2Done = saved || flags.saved;
  const step3Hint = flags.dashboardVisited;

  const highlight2 = step1Done && !step2Done;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5"
      role="navigation"
      aria-label="Your next steps"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Your path</p>
      <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
        <li
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl border px-3 py-2.5 sm:min-w-[140px] ${
            step1Done ? "border-emerald-500/40 bg-emerald-950/25" : "border-white/10 bg-black/20"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step1Done ? "bg-emerald-500 text-slate-950" : "border border-white/20 text-slate-500"
            }`}
            aria-hidden
          >
            {step1Done ? "✓" : "1"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1</p>
            <p className={`text-sm font-medium ${step1Done ? "text-emerald-200" : "text-slate-400"}`}>Analyze</p>
          </div>
        </li>

        <li
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl border px-3 py-2.5 sm:min-w-[160px] ${
            highlight2
              ? "border-amber-400/70 bg-amber-950/35 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
              : step2Done
                ? "border-emerald-500/40 bg-emerald-950/20"
                : "border-white/10 bg-black/20"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step2Done ? "bg-emerald-500 text-slate-950" : highlight2 ? "bg-amber-500 text-slate-950" : "border border-white/20 text-slate-500"
            }`}
            aria-hidden
          >
            {step2Done ? "✓" : "2"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2</p>
            <p className={`text-sm font-medium ${highlight2 ? "text-amber-100" : step2Done ? "text-emerald-200" : "text-slate-400"}`}>
              Save Deal
            </p>
            {highlight2 ? (
              <p className="mt-1 text-[11px] leading-snug text-amber-200/90">Do this next — takes one tap</p>
            ) : null}
          </div>
        </li>

        <li
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl border px-3 py-2.5 sm:min-w-[180px] ${
            step3Hint ? "border-sky-500/35 bg-sky-950/20" : "border-white/10 bg-black/20"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step3Hint ? "bg-sky-500 text-slate-950" : "border border-white/20 text-slate-500"
            }`}
            aria-hidden
          >
            {step3Hint ? "✓" : "3"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3</p>
            <p className={`text-sm font-medium ${step3Hint ? "text-sky-200" : "text-slate-400"}`}>Compare / Dashboard</p>
            {!step3Hint && step2Done ? (
              <p className="mt-1 text-[11px] leading-snug text-slate-500">Open portfolio or compare deals</p>
            ) : null}
          </div>
        </li>
      </ol>
    </div>
  );
}
