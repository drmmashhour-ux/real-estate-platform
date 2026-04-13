"use client";

import { Clock, Copy, MapPin, MoreHorizontal, Shield } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";
import { formatRemaining } from "./utils";

export function ActiveShareSessionCard() {
  const {
    active,
    session,
    remainingMs,
    shareUrl,
    busy,
    copyShareLink,
    setExtendModalOpen,
    setStopDialogOpen,
  } = useShareMyStay();

  if (!active || !session) return null;

  const modeLabel =
    session.shareType === "LIVE_LOCATION" ? "Live location + stay status" : "Stay status only";

  return (
    <div className="rounded-xl border border-emerald-500/45 bg-emerald-950/45 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            Sharing Active
          </span>
        </div>
        <span className="font-mono text-sm tabular-nums text-emerald-200">{formatRemaining(remainingMs)}</span>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-slate-500">
            <Clock className="mr-1 inline h-3.5 w-3.5 text-slate-500" aria-hidden />
            Expires
          </dt>
          <dd className="text-slate-100">{new Date(session.expiresAt).toLocaleString()}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-slate-500">
            <Shield className="mr-1 inline h-3.5 w-3.5 text-slate-500" aria-hidden />
            Shared with
          </dt>
          <dd className="text-white">{session.displayLabel ?? "Your contact"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-slate-500">
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-500" aria-hidden />
            Mode
          </dt>
          <dd className="text-slate-200">{modeLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-slate-500">Last updated</dt>
          <dd className="text-slate-300">
            {session.shareType === "STAY_STATUS_ONLY"
              ? "Not shown (stay status only)"
              : session.lastLocationAt
                ? new Date(session.lastLocationAt).toLocaleString()
                : "Waiting for first location"}
          </dd>
        </div>
      </dl>

      {session.shareUrlHint ? <p className="mt-3 text-[11px] text-emerald-200/70">{session.shareUrlHint}</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy || !shareUrl}
          onClick={() => void copyShareLink()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50 sm:flex-none sm:min-w-[140px]"
        >
          <Copy className="h-4 w-4" aria-hidden />
          Copy secure link
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setExtendModalOpen(true)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50 sm:flex-none sm:min-w-[120px]"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
          Extend
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setStopDialogOpen(true)}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm font-semibold text-rose-100 hover:bg-rose-900/40 disabled:opacity-50 sm:ml-auto sm:flex-none"
        >
          Stop sharing
        </button>
      </div>
    </div>
  );
}
