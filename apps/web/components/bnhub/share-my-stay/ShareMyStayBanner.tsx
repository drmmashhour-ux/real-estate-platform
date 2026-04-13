"use client";

import { Radio } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";

export function ShareMyStayBanner() {
  const { active, session, openManage, setStopDialogOpen } = useShareMyStay();

  if (!active) return null;

  const headline =
    session?.shareType === "LIVE_LOCATION" ? "Location sharing is active." : "Stay sharing is active.";

  const endsLine = session?.expiresAt
    ? `Your access will end automatically at ${new Date(session.expiresAt).toLocaleString()}.`
    : null;

  return (
    <div className="sticky top-0 z-30 border-b border-emerald-500/25 bg-emerald-950/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-start gap-2.5 sm:items-center">
          <Radio className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400 sm:mt-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-emerald-50">{headline}</p>
            {endsLine ? <p className="mt-0.5 text-xs text-emerald-200/75">{endsLine}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openManage}
            className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
          >
            Manage
          </button>
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/40"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
