"use client";

import { useEffect, useMemo, useState } from "react";

import type { AiCloserAssistOutput } from "@/modules/ai-closer/ai-closer.types";
import type { AiCloserRouteContext } from "@/modules/ai-closer/ai-closer.types";

export function AiCloserLivePanel({
  transcript,
  lastLine,
  route,
  listingHint,
  leadId,
}: {
  transcript: string;
  lastLine: string;
  route: AiCloserRouteContext;
  listingHint?: string;
  leadId?: string;
}) {
  const [out, setOut] = useState<AiCloserAssistOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const payloadKey = useMemo(() => `${transcript.slice(-800)}|${lastLine}|${route}|${leadId ?? ""}`, [transcript, lastLine, route, leadId]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!lastLine.trim() && !transcript.trim()) {
        setOut(null);
        return;
      }
      fetch("/api/ai-closer/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          messages: lastLine ? [lastLine] : undefined,
          route,
          listingHint,
          leadId,
          persistStage: Boolean(leadId),
        }),
      })
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? "assist_failed");
          if (!cancelled) {
            setOut(j as AiCloserAssistOutput);
            setErr(null);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setErr(e.message);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [payloadKey, transcript, lastLine, route, listingHint, leadId]);

  if (!lastLine.trim() && !transcript.trim()) {
    return (
      <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-4 text-xs text-zinc-500">
        AI Closer — add transcript to see stage, objections, and booking hints (LECIPM assistant).
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-xs text-red-200">
        AI Closer unavailable: {err}
      </div>
    );
  }

  if (!out) {
    return (
      <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-4 text-xs text-cyan-200/80">
        Loading AI Closer assist…
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-cyan-900/35 bg-gradient-to-br from-cyan-950/40 to-black/50 p-5 text-sm text-zinc-100">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/90">AI Closer · LECIPM assistant</p>
      <p className="mt-2 text-[11px] text-zinc-500">{out.assistantDisclosure}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Stage</p>
          <p className="mt-1 font-semibold text-white">{out.detectedStage}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Objection</p>
          <p className="mt-1 font-semibold text-amber-200/90">{out.objection}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Confidence</p>
          <p className="mt-1 font-semibold text-emerald-200">{(out.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3">
        <p className="text-[10px] uppercase text-emerald-400">Next best close</p>
        <p className="mt-2 text-lg font-medium leading-snug text-white">{out.response.main}</p>
        <p className="mt-3 text-xs text-zinc-400">
          Alt A: {out.response.alternatives[0]}
          <br />
          Alt B: {out.response.alternatives[1]}
        </p>
        <p className="mt-3 text-[11px] text-emerald-200/90">Best CTA: {out.response.bestCta}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Next question</p>
          <p className="mt-2 text-sm text-zinc-200">{out.nextBestQuestion}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Booking</p>
          <p className="mt-2 text-sm text-zinc-200">{out.bookingPrompt}</p>
          <p className="mt-2 text-[11px] text-zinc-500">
            Attempt now? <strong className="text-white">{out.shouldAttemptBooking ? "yes" : "no"}</strong>
          </p>
        </div>
      </div>

      {out.shouldEscalate && out.escalation ? (
        <div className="mt-4 rounded-xl border border-amber-600/45 bg-amber-950/35 px-4 py-3 text-xs text-amber-50">
          <strong className="text-amber-200">Escalate → {out.escalation.target}</strong> ({out.escalation.urgency}) —{" "}
          {out.escalation.reason}
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-zinc-500">Escalation: not required for this turn.</p>
      )}

      <details className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-zinc-400">
        <summary className="cursor-pointer text-zinc-300">Explainability</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Stage reasons: {out.explanation.stageReasons.join("; ") || "—"}</li>
          <li>{out.explanation.whyThisLine}</li>
          <li>Booking: {out.explanation.bookingRecommendation} — {out.explanation.bookingReason}</li>
          <li>Escalation: {out.explanation.escalationRecommendation} — {out.explanation.escalationReason}</li>
          <li>{out.explanation.complianceNote}</li>
        </ul>
      </details>
    </section>
  );
}
