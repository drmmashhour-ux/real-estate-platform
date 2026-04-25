"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Pause, Play, RotateCcw, X } from "lucide-react";

type TimedWarning = {
  afterSec: number;
  id: string;
  message: string;
};

const DEFAULT_WARNINGS: TimedWarning[] = [
  { afterSec: 150, id: "talk", message: "⚠️ You are talking too long" },
  { afterSec: 240, id: "demo", message: "⚠️ Move to demo" },
  { afterSec: 420, id: "pace", message: "⚠️ Stay under 10 minutes — tighten the story" },
  { afterSec: 520, id: "next", message: "⚠️ Ask for next step" },
];

/**
 * Live demo guard — elapsed timer + timed nudges so the operator keeps the call sharp.
 */
export function MistakeGuard() {
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [panelOpen, setPanelOpen] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const activeWarning = useMemo(() => {
    const triggered = DEFAULT_WARNINGS.filter((w) => elapsedSec >= w.afterSec && !dismissed.has(w.id));
    return triggered.length ? triggered[triggered.length - 1] : null;
  }, [elapsedSec, dismissed]);

  const formatMmSs = useCallback((total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setElapsedSec(0);
    setDismissed(new Set());
  }, []);

  const dismissCurrent = useCallback(() => {
    if (activeWarning) {
      setDismissed((prev) => new Set(prev).add(activeWarning.id));
    }
  }, [activeWarning]);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-black/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Live warnings
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 font-mono text-sm text-zinc-200">
            <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
            {formatMmSs(elapsedSec)}
          </span>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            title="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        Démarre au début du call. Alertes à ~2:30, ~4:00, ~7:00 et ~8:40 pour garder la démo sous 10 minutes.
      </p>

      {activeWarning && panelOpen ? (
        <div
          role="alert"
          className="relative mt-4 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 pr-10 text-sm font-semibold text-amber-50"
        >
          {activeWarning.message}
          <button
            type="button"
            onClick={dismissCurrent}
            className="absolute right-2 top-2 rounded-md p-1 text-amber-200/80 hover:bg-black/20 hover:text-white"
            aria-label="Dismiss this warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="mt-3 text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
      >
        {panelOpen ? "Hide alert strip" : "Show alert strip"}
      </button>
    </div>
  );
}
