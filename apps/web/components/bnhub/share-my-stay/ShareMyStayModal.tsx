"use client";

import { useState } from "react";
import { useShareMyStay } from "./ShareMyStayContext";
import type { DurationChoice, ModeChoice, ShareMethodChoice } from "./types";

export function ShareMyStayModal() {
  const { modalOpen, setModalOpen, busy, startSession, checkoutLabel } = useShareMyStay();
  const [contactLabel, setContactLabel] = useState("");
  const [shareMethod, setShareMethod] = useState<ShareMethodChoice>("link");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [duration, setDuration] = useState<DurationChoice>("1h");
  const [mode, setMode] = useState<ModeChoice>("live_location");

  if (!modalOpen) return null;

  async function onSubmit() {
    await startSession({
      contactLabel,
      shareMethod,
      recipientEmail,
      duration,
      mode,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-stay-modal-title"
      onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
    >
      <div className="max-h-[min(90vh,760px)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
        <h3 id="share-stay-modal-title" className="text-lg font-semibold text-white">
          Share My Stay
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Share your stay or location temporarily with someone you trust.
        </p>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
            1 — Who are you sharing with?
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-400">
            Name or label
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
              placeholder="e.g. Mom, Alex"
              value={contactLabel}
              onChange={(e) => setContactLabel(e.target.value)}
              autoComplete="off"
            />
          </label>
          <p className="mt-4 text-xs font-medium text-slate-500">How to send it</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShareMethod("link")}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                shareMethod === "link"
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
                  : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-600"
              }`}
            >
              Copy secure link
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500">You share the link yourself</span>
            </button>
            <button
              type="button"
              onClick={() => setShareMethod("email")}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                shareMethod === "email"
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
                  : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-600"
              }`}
            >
              Send by email
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500">Stored when encryption is on</span>
            </button>
          </div>
          {shareMethod === "email" ? (
            <label className="mt-3 block text-xs font-medium text-slate-400">
              Email address
              <input
                type="email"
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
            2 — What do you want to share?
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
              <input
                type="radio"
                name="share-mode"
                checked={mode === "stay_status_only"}
                onChange={() => setMode("stay_status_only")}
                className="mt-0.5 h-4 w-4 border-slate-600 text-emerald-500"
              />
              <span>
                Stay status only
                <span className="mt-0.5 block text-xs font-normal text-slate-500">Booking status, no map</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
              <input
                type="radio"
                name="share-mode"
                checked={mode === "live_location"}
                onChange={() => setMode("live_location")}
                className="mt-0.5 h-4 w-4 border-slate-600 text-emerald-500"
              />
              <span>
                Live location + stay status
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Last point only — updates while this page is open and location is allowed
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">3 — How long?</p>
          <div className="mt-3 space-y-2">
            {(
              [
                ["1h", "1 hour"],
                ["8h", "8 hours"],
                ["until_checkin", "Until check-in"],
                ["until_checkout", `Until checkout (${checkoutLabel})`],
              ] as const
            ).map(([val, label]) => (
              <label
                key={val}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200"
              >
                <input
                  type="radio"
                  name="share-duration"
                  checked={duration === val}
                  onChange={() => setDuration(val)}
                  className="h-4 w-4 border-slate-600 text-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">4 — Privacy</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-500">
            <li>Sharing is off by default until you start.</li>
            <li>You can stop sharing at any time.</li>
            <li>Access ends automatically when the window closes.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="flex-1 rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSubmit()}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Starting…" : "Start sharing"}
          </button>
        </div>
      </div>
    </div>
  );
}
