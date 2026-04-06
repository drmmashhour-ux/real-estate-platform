"use client";

import { PRICING_CAD } from "@/lib/monetization/pricing";

export function ContactLock({
  isPaid,
  onUnlock,
  busy,
}: {
  isPaid: boolean;
  onUnlock: () => void;
  busy?: boolean;
}) {
  if (isPaid) {
    return (
      <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
        Contact unlocked — representative details are shown below.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
      <p className="text-sm font-medium text-slate-200">Unlock contact instantly</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-400">
        <li>Access verified representative contact details instantly</li>
        <li>Save time versus cold outreach</li>
        <li>Connect directly and move faster on next steps</li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        One-time payment · ${PRICING_CAD.leadPrice.toFixed(0)} CAD · processed securely by Stripe
      </p>
      <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500">
        <li>One-time payment, no hidden charges</li>
        <li>No commitment required</li>
      </ul>
      <button
        type="button"
        onClick={onUnlock}
        disabled={busy}
        className="mt-4 min-h-[44px] w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
      >
        {busy ? "Redirecting…" : "Unlock contact instantly"}
      </button>
    </div>
  );
}
