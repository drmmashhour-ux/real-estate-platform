"use client";

import { useEffect, useMemo, useState } from "react";

import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import {
  buildUltimateCloserPayload,
  closerStepRail,
  getHardObjectionResponse,
  recordCloserStepView,
} from "@/modules/closing";
import type { ClosingFlowStep } from "@/modules/closing";
import type { ScriptAudience } from "@/modules/sales-scripts/sales-script.types";

export function CloserModePanel({
  callStage,
  audience,
  lastProspectInput,
  transcriptSnippet,
  lastRepSample,
  compact,
}: {
  callStage: CallStage;
  audience: ScriptAudience;
  lastProspectInput: string;
  transcriptSnippet?: string;
  /** Optional: last thing the rep said — improves control score heuristic */
  lastRepSample?: string;
  compact?: boolean;
}) {
  const [stepOverride, setStepOverride] = useState<ClosingFlowStep | "">("");

  const payload = useMemo(
    () =>
      buildUltimateCloserPayload(
        {
          callStage,
          audience,
          lastProspectInput,
          transcriptSnippet,
          closerStepOverride: stepOverride || undefined,
        },
        { lastRepUtteranceSample: lastRepSample },
      ),
    [callStage, audience, lastProspectInput, transcriptSnippet, stepOverride, lastRepSample],
  );

  useEffect(() => {
    recordCloserStepView(payload.step);
  }, [payload.step]);

  const rail = useMemo(() => closerStepRail(payload.step), [payload.step]);

  if (compact) {
    return (
      <div className="space-y-2">
        {payload.closeNow ? (
          <div className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-3 text-xs text-amber-100">
            <span className="font-semibold">Close now · </span>
            {payload.closeNowReason ?? "Land calendar / binary choice."}
          </div>
        ) : null}
        <div className="rounded-xl border border-orange-900/40 bg-orange-950/25 px-4 py-3 text-xs text-zinc-200">
          <p className="font-semibold text-orange-200">
            Closer · {payload.stepMeta.title}{" "}
            <span className="font-normal text-zinc-500">
              (~{payload.confidenceScore}% · control {payload.controlLevel})
            </span>
          </p>
          <p className="mt-1 line-clamp-3 text-zinc-400">{payload.mainLine}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-orange-900/35 bg-gradient-to-br from-orange-950/35 to-black/50 p-5 text-sm text-zinc-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-300/90">Closer mode</p>
          <p className="mt-2 text-xs text-zinc-500">{payload.mergeNote}</p>
        </div>
        <label className="text-[11px] text-zinc-500">
          Step override
          <select
            className="ml-2 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white"
            value={stepOverride}
            onChange={(e) => setStepOverride((e.target.value || "") as ClosingFlowStep | "")}
          >
            <option value="">Auto</option>
            <option value="hook">Hook</option>
            <option value="value">Value</option>
            <option value="question">Question</option>
            <option value="align">Align</option>
            <option value="micro_close">Micro-close</option>
            <option value="final_close">Final close</option>
          </select>
        </label>
      </div>

      {payload.closeNow ? (
        <div className="mt-4 rounded-xl border border-amber-600/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-50">
          <span className="font-semibold text-amber-200">Close now · </span>
          {payload.closeNowReason}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {rail.map(({ step, done }) => (
          <span
            key={step}
            className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${
              payload.step === step
                ? "bg-orange-600/40 text-orange-100"
                : done
                  ? "bg-white/5 text-zinc-500 line-through"
                  : "bg-black/30 text-zinc-500"
            }`}
          >
            {step.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-white/10 px-3 py-1 text-zinc-300">{payload.personalityLabel}</span>
        <span className="rounded-full bg-emerald-950/40 px-3 py-1 text-emerald-200/90">
          Control ~{payload.controlLevel}
        </span>
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-zinc-400">
          Confidence ~{payload.confidenceScore}%
        </span>
      </div>

      <p className="mt-3 text-[11px] uppercase text-zinc-500">{payload.stepMeta.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{payload.stepMeta.guidance}</p>

      <div className="mt-4 rounded-xl border border-orange-900/30 bg-black/40 p-4">
        <p className="text-[11px] uppercase text-orange-400/90">Next line</p>
        <p className="mt-2 text-lg font-medium leading-snug text-white">{payload.mainLine}</p>
        <p className="mt-2 text-xs text-zinc-500">Tone: {payload.recommendedTone}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Alternative A</p>
          <p className="mt-2 text-sm text-zinc-300">{payload.alternatives[0]}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Alternative B</p>
          <p className="mt-2 text-sm text-zinc-300">{payload.alternatives[1]}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase text-red-400/80">Avoid</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-200/75">
          {payload.avoid.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
        <p className="text-[11px] font-semibold uppercase text-zinc-400">Hard objections</p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          {(["not_interested", "no_time", "already_have_solution", "send_email"] as const).map((k) => {
            const o = getHardObjectionResponse(k);
            return (
              <details key={k} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <summary className="cursor-pointer text-zinc-300">{k.replace(/_/g, " ")}</summary>
                <p className="mt-2 text-zinc-400">{o.main}</p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
