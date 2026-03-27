"use client";

import { useState } from "react";
import { GUEST_ONBOARDING_TIPS } from "@/services/growth/retention";

/**
 * Lightweight first-search UX aid — keeps bundle small; no extra requests.
 */
export function GuestOnboardingTips() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-emerald-400/90 hover:text-emerald-300"
      >
        Show search tips
      </button>
    );
  }

  return (
    <aside className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3 text-sm text-slate-200">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Quick tips</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-300"
          aria-label="Dismiss tips"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
        {GUEST_ONBOARDING_TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </aside>
  );
}
