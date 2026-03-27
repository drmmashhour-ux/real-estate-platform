"use client";

import { useCallback, useState } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

type Props = {
  /** e.g. analyze_results, after_save, dashboard */
  context: string;
  className?: string;
};

/**
 * Lightweight yes/no micro-feedback — stored as TrafficEvent (admin can aggregate).
 */
export function WasThisHelpful({ context, className = "" }: Props) {
  const [done, setDone] = useState<"yes" | "no" | null>(null);

  const fire = useCallback(
    (helpful: boolean) => {
      track(TrackingEvent.MICRO_FEEDBACK_HELPFUL, {
        meta: { context, helpful: helpful ? "true" : "false" },
      });
      setDone(helpful ? "yes" : "no");
    },
    [context]
  );

  if (done) {
    return (
      <p className={`text-xs text-slate-500 ${className}`} role="status">
        Thanks — your feedback helps us improve.
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-slate-500 ${className}`}>
      <span className="text-slate-400">Was this helpful?</span>
      <button
        type="button"
        onClick={() => fire(true)}
        className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 font-medium text-slate-200 transition hover:border-emerald-500/40 hover:text-white"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => fire(false)}
        className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 font-medium text-slate-200 transition hover:border-white/25 hover:text-white"
      >
        No
      </button>
    </div>
  );
}
