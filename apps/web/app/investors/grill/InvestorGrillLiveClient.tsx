"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateGrillAnswer, type GrillFeedbackResult } from "@/modules/investor/grillFeedback";
import {
  getNextQuestion,
  INVESTOR_PERSONAS,
  nextPitchPhase,
  type GrillContext,
  type GrillMode,
  type GrillQuestion,
  type NextQuestionResult,
  type PersonaId,
} from "@/modules/investor/grillEngine";

const MAX_TURNS = 8;

type SessionTurn = {
  turnIndex: number;
  displayText: string;
  userAnswer: string;
  feedback: GrillFeedbackResult;
  timedOut: boolean;
  question: GrillQuestion;
  pressureKind: string;
};

export function InvestorGrillLiveClient() {
  const [mode, setMode] = useState<GrillMode>("standard");
  const [personaId, setPersonaId] = useState<PersonaId>("vc");
  const [view, setView] = useState<"setup" | "live" | "summary" | "replay">("setup");

  const [turnIndex, setTurnIndex] = useState(0);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [pressureLevel, setPressureLevel] = useState(0);
  const [lastQid, setLastQid] = useState<string | undefined>();

  const [current, setCurrent] = useState<NextQuestionResult | null>(null);
  const [answer, setAnswer] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState<GrillFeedbackResult | null>(null);
  const [turns, setTurns] = useState<SessionTurn[]>([]);
  const [prevAnswer, setPrevAnswer] = useState<string | undefined>();
  const [prevScore, setPrevScore] = useState<number | undefined>();

  const [retryQ, setRetryQ] = useState<GrillQuestion | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<GrillFeedbackResult | null>(null);
  const [retryAnswer, setRetryAnswer] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activePhase = useMemo(() => nextPitchPhase(turnIndex), [turnIndex]);

  const startSession = useCallback(() => {
    setTurns([]);
    setTurnIndex(0);
    setWeakAreas([]);
    setPressureLevel(0);
    setLastQid(undefined);
    setPrevAnswer(undefined);
    setPrevScore(undefined);
    setPendingFeedback(null);
    setAnswer("");
    const ctx: GrillContext = {
      mode,
      personaId,
      pitchPhase: nextPitchPhase(0),
      turnIndex: 0,
      previousAnswer: undefined,
      previousScore: undefined,
      weakAreas: [],
      lastQuestionId: undefined,
      pressureLevel: 0,
    };
    const first = getNextQuestion(ctx, { maxTurns: MAX_TURNS });
    if (!first) return;
    setCurrent(first);
    setSecondsLeft(first.timeLimitSeconds);
    setView("live");
  }, [mode, personaId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset timer when `current` changes
  useEffect(() => {
    if (!current || view !== "live" || pendingFeedback) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setSecondsLeft(current.timeLimitSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current?.question.id, view, pendingFeedback]);

  const finishTurn = useCallback(
    (userAnswer: string, timedOut: boolean) => {
      if (!current) return;
      if (pendingFeedback) return;
      const fb = evaluateGrillAnswer(userAnswer, current.question.keyPoints, current.question.modelAnswer, {
        timedOut,
      });
      setPendingFeedback(fb);
      if (fb.score < 5.5) {
        setWeakAreas((w) => {
          const tag = current.question.tags?.[0] ?? "depth";
          return w.includes(tag) ? w : [...w, tag].slice(-4);
        });
        setPressureLevel((p) => Math.min(1, p + 0.12));
      }
      const row: SessionTurn = {
        turnIndex,
        displayText: current.displayText,
        userAnswer: userAnswer || (timedOut ? "(timeout — no answer)" : ""),
        feedback: fb,
        timedOut,
        question: current.question,
        pressureKind: current.pressureKind,
      };
      setTurns((t) => [...t, row]);
      setPrevAnswer(userAnswer);
      setPrevScore(fb.score);
      setLastQid(current.question.id);
    },
    [current, pendingFeedback, turnIndex],
  );

  useEffect(() => {
    if (view !== "live" || !current || pendingFeedback) return;
    if (secondsLeft > 0) return;
    void finishTurn("", true);
  }, [view, current, finishTurn, pendingFeedback, secondsLeft]);

  const onSubmitAnswer = () => {
    if (!current || pendingFeedback) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    finishTurn(answer, false);
  };

  const nextQuestion = useCallback(() => {
    if (!pendingFeedback) return;
    setAnswer("");
    setPendingFeedback(null);
    const nextIdx = turnIndex + 1;
    if (nextIdx >= MAX_TURNS) {
      setCurrent(null);
      setView("summary");
      return;
    }
    setTurnIndex(nextIdx);
    const ctx: GrillContext = {
      mode,
      personaId,
      pitchPhase: nextPitchPhase(nextIdx),
      turnIndex: nextIdx,
      previousAnswer: prevAnswer,
      previousScore: prevScore,
      weakAreas,
      lastQuestionId: lastQid,
      pressureLevel,
    };
    const n = getNextQuestion(ctx, { maxTurns: MAX_TURNS });
    if (!n) {
      setCurrent(null);
      setView("summary");
      return;
    }
    setCurrent(n);
    setSecondsLeft(n.timeLimitSeconds);
  }, [lastQid, mode, pendingFeedback, personaId, pressureLevel, prevAnswer, prevScore, turnIndex, weakAreas]);

  const summary = useMemo(() => {
    if (!turns.length) return null;
    const avg = turns.reduce((a, t) => a + t.feedback.score, 0) / turns.length;
    const best = turns.reduce(
      (m, t) => (t.feedback.score > (m?.feedback.score ?? 0) ? t : m),
      turns[0]!,
    );
    const dimAgg = { clarity: 0, confidence: 0, conciseness: 0, logic: 0, conviction: 0 };
    for (const t of turns) {
      for (const k of Object.keys(dimAgg) as (keyof typeof dimAgg)[]) {
        dimAgg[k] += t.feedback.dimensions[k];
      }
    }
    const n = turns.length;
    (Object.keys(dimAgg) as (keyof typeof dimAgg)[]).forEach((k) => (dimAgg[k] /= n));
    let minDim: keyof typeof dimAgg = "clarity";
    (Object.keys(dimAgg) as (keyof typeof dimAgg)[]).forEach((k) => {
      if (dimAgg[k] < dimAgg[minDim]) minDim = k;
    });
    const weakFreq = new Map<string, number>();
    for (const t of turns) {
      for (const w of t.feedback.weakPoints) {
        weakFreq.set(w, (weakFreq.get(w) ?? 0) + 1);
      }
    }
    const biggest = [...weakFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? `lowest: ${minDim}`;

    return { avg, best, minDim, biggest, tips: `Drill 3 reps on: ${minDim} under a 15s cap.` };
  }, [turns]);

  const onRetry = (q: GrillQuestion) => {
    setRetryQ(q);
    setRetryAnswer("");
    setRetryFeedback(null);
    setView("replay");
  };

  const onSubmitRetry = () => {
    if (!retryQ) return;
    const fb = evaluateGrillAnswer(retryAnswer, retryQ.keyPoints, retryQ.modelAnswer);
    setRetryFeedback(fb);
  };

  if (view === "setup" || (view === "live" && !current)) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">InvestorGrillLive</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Real investor grilling (pressure mode)</h1>
          <p className="text-sm text-zinc-400">
            Modes, personas, and timers simulate interruption—feedback is heuristic practice only, not a diligence grade.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mode</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["warmup", "Warmup (easy)"] as const,
                  ["standard", "Standard (realistic)"] as const,
                  ["hardcore", "Hardcore (aggressive)"] as const,
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={
                    "rounded-lg border px-3 py-2 text-xs font-medium transition " +
                    (mode === id
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Investor persona</p>
            <div className="mt-2 space-y-2">
              {(["vc", "angel", "skeptic", "legal"] as const).map((id) => {
                const p = INVESTOR_PERSONAS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPersonaId(id)}
                    className={
                      "w-full rounded-lg border px-3 py-2 text-left text-sm transition " +
                      (personaId === id
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-600")
                    }
                  >
                    <span className="font-medium text-zinc-100">{p.name}</span>
                    <span className="ml-2 text-xs text-zinc-500">— {p.label}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">{p.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={startSession}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
        >
          Start live session
        </button>
      </div>
    );
  }

  if (view === "live" && current) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            Mode: <span className="text-zinc-300">{mode}</span> · Persona:{" "}
            <span className="text-zinc-300">{INVESTOR_PERSONAS[personaId].name}</span> · Turn {turnIndex + 1}/
            {MAX_TURNS} · Phase: <span className="text-zinc-300">{activePhase}</span>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live pitch</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                You’re mid-pitch. Answer aloud or in text as if the room is unforgiving—one idea per breath.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">You</p>
              <textarea
                className="mt-2 min-h-[100px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder:text-zinc-600"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!pendingFeedback}
                placeholder="Type your response… (voice input coming later)"
              />
            </div>
            {!pendingFeedback && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSubmitAnswer}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"
                >
                  Lock in answer
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div
              className={
                "rounded-2xl border p-4 " +
                (secondsLeft <= 3 ? "border-red-500/50 bg-red-500/5" : "border-zinc-800 bg-zinc-900/40")
              }
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timer</p>
              <p className="mt-1 font-mono text-4xl tabular-nums text-white">
                {pendingFeedback ? "—" : `${secondsLeft}`}
                <span className="text-base text-zinc-500">s</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {mode === "warmup" && "~18–20s"} {mode === "standard" && "~12–16s"}{" "}
                {mode === "hardcore" && "~10–12s"} per answer
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Investor panel</p>
              {current.pressureKind !== "none" && (
                <p className="mt-2 text-xs font-semibold text-amber-300/90">Pressure event · {current.pressureKind}</p>
              )}
              <p className="mt-2 text-sm font-medium text-zinc-100 leading-snug">
                {INVESTOR_PERSONAS[personaId].name} ·{" "}
                <span className="text-zinc-500">[{current.question.type}]</span>
              </p>
              <p className="mt-3 text-sm text-zinc-200 leading-relaxed">{current.displayText}</p>
            </div>
          </div>
        </div>

        {pendingFeedback && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Feedback + score</p>
            <p className="mt-1 text-2xl font-bold text-white">{pendingFeedback.score.toFixed(1)}</p>
            <p className="text-xs text-zinc-500">Confidence: {pendingFeedback.confidenceLevel}</p>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-5">
              {(Object.entries(pendingFeedback.dimensions) as [string, number][]).map(([k, v]) => (
                <div key={k} className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-1">
                  <p className="text-[9px] uppercase text-zinc-500">{k}</p>
                  <p className="font-mono text-zinc-200">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-emerald-200/90">
              <span className="text-zinc-500">Strong: </span>
              {pendingFeedback.strongPoints.join(" · ")}
            </p>
            <p className="mt-1 text-sm text-rose-200/80">
              <span className="text-zinc-500">Gaps: </span>
              {pendingFeedback.weakPoints.slice(0, 3).join(" · ")}
            </p>
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-300">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Improved answer (reference)</p>
              <p className="mt-1 text-zinc-200">{pendingFeedback.improvedAnswer}</p>
            </div>
            <button
              type="button"
              onClick={nextQuestion}
              className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900"
            >
              {turnIndex + 1 >= MAX_TURNS ? "View session summary" : "Next question"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (view === "summary" && summary) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h2 className="text-xl font-bold text-white">Session summary</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs uppercase text-zinc-500">Total score (avg)</p>
            <p className="text-2xl font-bold text-amber-300">{summary.avg.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs uppercase text-zinc-500">Biggest weakness theme</p>
            <p className="text-sm text-zinc-200">{summary.biggest}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase text-zinc-500">Best answer (highest turn)</p>
          <p className="text-sm text-zinc-200">{summary.best.displayText.slice(0, 200)}…</p>
          <p className="mt-1 text-xs text-zinc-500">Score {summary.best.feedback.score.toFixed(1)}</p>
        </div>
        <p className="text-sm text-zinc-400">Improvement: {summary.tips}</p>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-300">Replay — review & retry</p>
          <ul className="space-y-2">
            {turns.map((t) => (
              <li
                key={t.turnIndex + t.question.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-sm"
              >
                <div>
                  <p className="text-xs text-zinc-500">Turn {t.turnIndex + 1} · {t.timedOut ? "timeout" : "answered"}</p>
                  <p className="text-zinc-200">{t.displayText.slice(0, 120)}…</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRetry(t.question)}
                  className="shrink-0 text-xs text-amber-400 hover:text-amber-300"
                >
                  Retry
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            setView("setup");
            setCurrent(null);
            setPendingFeedback(null);
            setTurns([]);
          }}
          className="text-sm text-zinc-400 underline hover:text-zinc-200"
        >
          New session
        </button>
      </div>
    );
  }

  if (view === "replay" && retryQ) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <p className="text-xs text-zinc-500">Replay / practice (single question)</p>
        <h2 className="text-lg font-bold text-zinc-100">Retry: {retryQ.id}</h2>
        <p className="text-sm text-zinc-300">{retryQ.text}</p>
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100"
          value={retryAnswer}
          onChange={(e) => setRetryAnswer(e.target.value)}
        />
        <button
          type="button"
          onClick={onSubmitRetry}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"
        >
          Get feedback
        </button>
        {retryFeedback && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-200">
            <p className="text-xl font-bold text-white">{retryFeedback.score.toFixed(1)}</p>
            <p className="mt-2 text-xs text-zinc-400">{retryFeedback.strongPoints.join(" · ")}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setView("summary")}
          className="text-sm text-amber-400/90 hover:text-amber-300"
        >
          Back to summary
        </button>
      </div>
    );
  }

  return null;
}
