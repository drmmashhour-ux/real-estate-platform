"use client";

import { MapPin, Shield } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";
import { ActiveShareSessionCard } from "./ActiveShareSessionCard";
import { ShareLocationUpdateRow } from "./ShareLocationUpdateRow";

export function ShareMyStaySection() {
  const { active, openStartModal } = useShareMyStay();

  return (
    <section
      id="share-my-stay"
      className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/30 to-slate-900/60 p-5 shadow-inner shadow-black/20"
      aria-labelledby="share-my-stay-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <MapPin className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="share-my-stay-heading" className="text-lg font-semibold tracking-tight text-white">
            Share your stay
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Let someone you trust follow your stay for safety.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            <span className="text-slate-400">Off by default.</span> Time-limited link; you can stop anytime. Only people
            you share the link with can view it. Last known location only — no history trail.
          </p>
        </div>
      </div>

      {active ? (
        <div className="mt-5 space-y-3">
          <ActiveShareSessionCard />
          <ShareLocationUpdateRow />
        </div>
      ) : (
        <div className="mt-5">
          <button
            type="button"
            onClick={openStartModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/30 hover:bg-emerald-400 sm:w-auto"
          >
            <Shield className="h-4 w-4" aria-hidden />
            Share My Stay
          </button>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Foreground updates only on this page — we don&apos;t run background tracking. For emergencies, contact local
        emergency services first.
      </p>
    </section>
  );
}
