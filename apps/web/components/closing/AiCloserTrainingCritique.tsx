"use client";

import { useEffect, useState } from "react";

import type { AiCloserAssistOutput } from "@/modules/ai-closer/ai-closer.types";

/** Surfaces missed close moments vs AI Closer baseline for training reps. */
export function AiCloserTrainingCritique({
  traineeReply,
  lastClientLine,
}: {
  traineeReply: string;
  lastClientLine: string;
}) {
  const [assist, setAssist] = useState<AiCloserAssistOutput | null>(null);

  useEffect(() => {
    if (!traineeReply.trim() || !lastClientLine.trim()) {
      setAssist(null);
      return;
    }
    const t = setTimeout(() => {
      fetch("/api/ai-closer/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: `Client: ${lastClientLine}\nRep: ${traineeReply}`,
          route: "training",
        }),
      })
        .then((r) => r.json())
        .then((j) => setAssist(j))
        .catch(() => setAssist(null));
    }, 500);
    return () => clearTimeout(t);
  }, [traineeReply, lastClientLine]);

  if (!assist) return null;

  const missed =
    traineeReply.length < 12 ||
    !/\b(visit|book|week|next|binary|choose|would you)\b/i.test(traineeReply);

  return (
    <div className="mt-6 rounded-2xl border border-violet-900/35 bg-violet-950/25 p-4 text-xs text-zinc-200">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300">AI closer critique</p>
      <p className="mt-2 text-zinc-400">
        Baseline stage: <strong className="text-white">{assist.detectedStage}</strong> · objection {assist.objection}
      </p>
      {missed ? (
        <p className="mt-2 text-amber-200/90">
          Missed close cue: consider a binary time question or explicit visit ask (see suggestion below).
        </p>
      ) : (
        <p className="mt-2 text-emerald-200/90">Solid — you advanced the thread with a clear next step.</p>
      )}
      <p className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white">
        Stronger line: {assist.response.main}
      </p>
    </div>
  );
}
