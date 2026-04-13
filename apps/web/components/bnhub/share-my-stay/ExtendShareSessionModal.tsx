"use client";

import { useShareMyStay } from "./ShareMyStayContext";
import type { ExtendPreset } from "./types";

const OPTIONS: { preset: ExtendPreset; title: string; hint: string }[] = [
  { preset: "1h", title: "+1 hour", hint: "Adds time from now (capped near checkout)" },
  { preset: "8h", title: "+8 hours", hint: "Longer window for travel days" },
  { preset: "until_checkout", title: "Until checkout", hint: "Extend to checkout time when possible" },
];

export function ExtendShareSessionModal() {
  const { extendModalOpen, setExtendModalOpen, extendSession, busy } = useShareMyStay();

  if (!extendModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[93] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="extend-share-title"
      onClick={(e) => e.target === e.currentTarget && setExtendModalOpen(false)}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
        <h3 id="extend-share-title" className="text-lg font-semibold text-white">
          Extend sharing
        </h3>
        <p className="mt-1 text-sm text-slate-400">Choose how much longer the secure link should work.</p>
        <ul className="mt-5 space-y-2">
          {OPTIONS.map((o) => (
            <li key={o.preset}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void extendSession(o.preset)}
                className="flex w-full flex-col rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left transition hover:border-emerald-500/40 hover:bg-slate-900 disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-white">{o.title}</span>
                <span className="mt-0.5 text-xs text-slate-500">{o.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setExtendModalOpen(false)}
          className="mt-4 w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}
