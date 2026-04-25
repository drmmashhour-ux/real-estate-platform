"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FIELD_DEMO_MAX_MS,
  FIELD_DEMO_WARN_ELAPSED_MS,
  FIELD_SCRIPT_STEPS,
  SECTION_TITLES,
  type FieldScriptStep,
} from "@/modules/field/field-agent-script";
import { cn } from "@/lib/utils";
import { Clock, Pause, Play, RotateCcw } from "lucide-react";

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Props = {
  className?: string;
};

export function ScriptPanel({ className }: Props) {
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const step = FIELD_SCRIPT_STEPS[index]!;

  const atEnd = index >= FIELD_SCRIPT_STEPS.length - 1;
  const warn = running && elapsedMs >= FIELD_DEMO_WARN_ELAPSED_MS && elapsedMs < FIELD_DEMO_MAX_MS;
  const over = running && elapsedMs >= FIELD_DEMO_MAX_MS;

  useEffect(() => {
    if (!running || !startedAt) return;
    const t = setInterval(() => {
      setElapsedMs(Math.min(FIELD_DEMO_MAX_MS, Date.now() - startedAt));
    }, 250);
    return () => clearInterval(t);
  }, [running, startedAt]);

  const startTimer = useCallback(() => {
    const t = Date.now() - elapsedMs;
    setStartedAt(t);
    setRunning(true);
  }, [elapsedMs]);

  const stopTimer = useCallback(() => {
    setRunning(false);
    if (startedAt) setElapsedMs(Date.now() - startedAt);
    setStartedAt(null);
  }, [startedAt]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setElapsedMs(0);
    setStartedAt(null);
  }, []);

  useEffect(() => {
    if (over) {
      setRunning(false);
      if (startedAt) setElapsedMs(FIELD_DEMO_MAX_MS);
      setStartedAt(null);
    }
  }, [over, startedAt]);

  const next = () => {
    if (atEnd) return;
    setIndex((i) => i + 1);
  };
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const currentSection = step.section;
  const showSectionLabel =
    index === 0 || FIELD_SCRIPT_STEPS[index - 1]!.section !== currentSection;

  const remainingLabel = useMemo(() => {
    const left = Math.max(0, FIELD_DEMO_MAX_MS - elapsedMs);
    return left;
  }, [elapsedMs]);

  return (
    <div className={cn("space-y-6", className)}>
      <div
        className={cn(
          "rounded-2xl border p-4",
          over
            ? "border-red-500/50 bg-red-500/5"
            : warn
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-zinc-800 bg-zinc-900/50",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400/90">
            <Clock className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Minuteur démo (max 10 min)</p>
          </div>
          <p className="font-mono text-2xl tabular-nums text-white">
            {over ? "0:00" : formatMs(remainingLabel)} <span className="text-sm text-zinc-500">restant</span>
          </p>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Écoulé : {formatMs(Math.min(elapsedMs, FIELD_DEMO_MAX_MS))} · Alerte à 8 min d’essai (2 min restantes)</p>
        {warn && !over && (
          <p className="mt-2 text-sm font-medium text-amber-200">Passage en clôture : il reste 2 minutes — serrer la démo et la transition.</p>
        )}
        {over && <p className="mt-2 text-sm font-medium text-red-200">Plafond 10 min atteint — proposer un créneau de suivi si besoin.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {!running ? (
            <button
              type="button"
              onClick={startTimer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Play className="h-3.5 w-3.5" /> Démarrer
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTimer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Remettre à zéro
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        {showSectionLabel && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
            {SECTION_TITLES[currentSection]}
          </p>
        )}
        <ol className="mt-3 space-y-2">
          {FIELD_SCRIPT_STEPS.map((s, i) => (
            <ScriptLine key={s.id} step={s} active={i === index} onPick={() => setIndex(i)} />
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500">
            Étape {index + 1} / {FIELD_SCRIPT_STEPS.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={next}
              disabled={atEnd}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-30"
            >
              Ligne suivante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScriptLine({
  step,
  active,
  onPick,
}: {
  step: FieldScriptStep;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "w-full rounded-xl border text-left text-sm leading-relaxed transition",
          active
            ? "border-amber-500/60 bg-amber-500/10 p-3 text-zinc-100 ring-1 ring-amber-500/30"
            : "border-transparent p-2 text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900/40",
        )}
      >
        {step.objectionLabel && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90">Objection : « {step.objectionLabel} »</p>
        )}
        <p className={active ? "mt-1 text-zinc-100" : "mt-0.5"}>
          {step.objectionLabel ? <span className="text-amber-200/80">→ </span> : null}
          {step.line}
        </p>
        {step.coachNote && (
          <p className={cn("mt-2 text-xs italic", active ? "text-amber-200/60" : "text-zinc-600")}>({step.coachNote})</p>
        )}
      </button>
    </li>
  );
}
