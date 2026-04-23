"use client";

import { useMemo } from "react";

import { buildClosingCoachBundle } from "@/modules/personality-closing/personality-response.service";

export function PsychologyCoachPanel({
  clientText,
  transcript,
  compact,
}: {
  /** Latest prospect utterance */
  clientText: string;
  transcript?: string;
  compact?: boolean;
}) {
  const bundle = useMemo(() => {
    const t = clientText.trim();
    if (!t) return null;
    return buildClosingCoachBundle(t, transcript);
  }, [clientText, transcript]);

  if (!bundle) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-500">
        Psychology + personality layers activate when the prospect’s last line is available.
      </div>
    );
  }

  const {
    detection,
    strategy,
    exampleSentence,
    indicator,
    responseStyle,
    personality,
    personalityStrategy,
    personalityIndicator,
    recommendedTone,
    adaptedExampleSentence,
    avoidCombined,
  } = bundle;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-violet-900/40 bg-violet-950/25 px-4 py-3 text-xs text-zinc-200">
          <p className="font-semibold text-violet-200">
            {indicator} · Stage: {detection.stage.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-zinc-400">{strategy.title}</p>
        </div>
        <div className="rounded-xl border border-sky-900/35 bg-sky-950/20 px-4 py-3 text-xs text-zinc-200">
          <p className="font-semibold text-sky-200">
            {personalityIndicator} · ~{personality.confidence}%
          </p>
          <p className="mt-1 text-zinc-400">{recommendedTone}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-900/35 bg-gradient-to-br from-violet-950/40 to-black/50 p-5 text-sm text-zinc-100">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300/90">Sales psychology</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-lg">{indicator}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
          Confidence ~{detection.confidence}%
        </span>
        <span className="text-xs text-zinc-500">
          Decision: <strong className="text-zinc-300">{detection.stage.replace(/_/g, " ")}</strong>
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{detection.rationale.join(" · ")}</p>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-4">
        <p className="text-[11px] uppercase text-zinc-500">Strategy</p>
        <p className="mt-1 font-medium text-white">{strategy.title}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {strategy.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Style: <span className="text-zinc-300">{responseStyle}</span>
      </p>

      <div className="mt-6 rounded-xl border border-sky-900/40 bg-sky-950/25 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/90">Personality close</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-base">{personalityIndicator}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
            ~{personality.confidence}%
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">{personality.rationale.join(" · ")}</p>
        <p className="mt-3 text-[11px] uppercase text-zinc-500">Recommended tone</p>
        <p className="mt-1 text-sm text-sky-100/95">{recommendedTone}</p>
        <p className="mt-3 text-[11px] uppercase text-zinc-500">{personalityStrategy.title}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {personalityStrategy.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-4">
        <p className="text-[11px] uppercase text-emerald-400/90">Adapted example (personality + psychology)</p>
        <p className="mt-2 text-base leading-relaxed text-emerald-50/95">{adaptedExampleSentence}</p>
        <p className="mt-3 text-[10px] uppercase text-zinc-600">Base psychology line</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{exampleSentence}</p>
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase text-red-400/80">Avoid</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-red-200/70">
          {avoidCombined.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
