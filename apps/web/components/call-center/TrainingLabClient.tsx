"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SimulationPersonaId, TrainingLevel } from "@/modules/call-center/call-center.types";
import { buildGamificationVm, levelFromAverageScore } from "@/modules/call-center/call-performance.service";
import { scoreTrainingReply } from "@/modules/call-center/training-feedback.service";
import {
  createInitialTurnState,
  getPersonaProfile,
  listPersonasForLevel,
  startSimulation,
  stepSimulation,
} from "@/modules/call-center/training-simulation.service";
import type { SimulationTurnState } from "@/modules/call-center/call-center.types";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

const STORAGE_SCORES = "lecipm-training-scores-v1";
const STORAGE_STREAK = "lecipm-training-streak-v1";

function loadScores(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SCORES);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is number => typeof x === "number").slice(-12) : [];
  } catch {
    return [];
  }
}

function persistScores(scores: number[]) {
  try {
    localStorage.setItem(STORAGE_SCORES, JSON.stringify(scores.slice(-12)));
  } catch {
    /* ignore */
  }
}

function loadStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(STORAGE_STREAK) ?? "0") || 0;
  } catch {
    return 0;
  }
}

function persistStreak(n: number) {
  try {
    localStorage.setItem(STORAGE_STREAK, String(n));
  } catch {
    /* ignore */
  }
}

export function TrainingLabClient({
  adminBase,
  dashBase,
}: {
  adminBase: string;
  dashBase: string;
}) {
  const [personaId, setPersonaId] = useState<SimulationPersonaId>("broker_busy");
  const [simState, setSimState] = useState<SimulationTurnState | null>(null);
  const [stage, setStage] = useState<CallStage>("opening");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<ReturnType<typeof scoreTrainingReply> | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setScores(loadScores());
    setStreak(loadStreak());
  }, []);

  const level = useMemo(() => levelFromAverageScore(scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0), [scores]);

  const gamification = useMemo(() => buildGamificationVm(scores, streak), [scores, streak]);

  const allowedPersonas = useMemo(() => listPersonasForLevel(level), [level]);

  const start = useCallback(() => {
    if (!allowedPersonas.includes(personaId)) return;
    const s = startSimulation(personaId);
    setSimState(createInitialTurnState(personaId, s.firstClientMessage));
    setStage(s.suggestedStage);
    setDraft("");
    setFeedback(null);
  }, [allowedPersonas, personaId]);

  const submitReply = useCallback(() => {
    if (!simState || simState.ended || !draft.trim()) return;

    const stepped = stepSimulation(simState, draft);
    const persona = getPersonaProfile(simState.personaId);

    const fb = scoreTrainingReply(draft.trim(), persona, {
      stage,
      discoveryIndex: undefined,
    });

    setScores((prev) => {
      const next = [...prev, fb.overallScore];
      persistScores(next);
      return next;
    });

    setStreak((s) => {
      const next = fb.overallScore >= 62 ? s + 1 : 0;
      persistStreak(next);
      return next;
    });

    setFeedback(fb);
    setSimState(stepped.state);
    setDraft("");
  }, [draft, simState, stage]);

  useEffect(() => {
    /** Auto-select unlocked persona when level changes */
    if (!allowedPersonas.includes(personaId) && allowedPersonas[0]) {
      setPersonaId(allowedPersonas[0]);
    }
  }, [allowedPersonas, personaId]);

  const clientLines = simState?.clientMessages ?? [];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-6 text-white">
      <header className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
          Elite closer · training lab
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Simulator</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Role-play only — nothing dials out. Coaching uses approved script lines & transparent scoring rules.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>
            Level: <strong className="text-zinc-200">{gamification.level}</strong>
          </span>
          <span>
            Avg score: <strong className="text-zinc-200">{gamification.averageScore || "—"}</strong>
          </span>
          <span>
            Streak: <strong className="text-zinc-200">{gamification.streak}</strong>
          </span>
          <span>
            Unlock harder personas at <strong className="text-zinc-300">intermediate+</strong> scores.
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link className="text-emerald-400 underline" href={`${dashBase}/call-live`}>
            Live call desk
          </Link>
          <Link className="text-zinc-400 underline" href={`${dashBase}/acquisition/call-assistant`}>
            Acquisition scripts
          </Link>
          <Link className="text-zinc-400 underline" href={`${adminBase}`}>
            Admin home
          </Link>
        </div>
      </header>

      <div className="grid min-h-[520px] gap-6 lg:grid-cols-2">
        {/* LEFT — simulated client */}
        <section className="flex flex-col rounded-2xl border border-white/10 bg-black/35">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">Simulated client</h2>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {clientLines.length === 0 ? (
              <p className="text-sm text-zinc-500">Choose a persona and start the scenario.</p>
            ) : (
              clientLines.map((line, i) => (
                <div key={`${i}-${line.slice(0, 24)}`} className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100">
                  {line}
                </div>
              ))
            )}
            {simState?.ended ? (
              <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                Scenario ended {simState.outcome ? `(${simState.outcome})` : ""}. Restart to practice again.
              </p>
            ) : null}
          </div>
          <div className="border-t border-white/10 px-4 py-3">
            <label className="text-[11px] uppercase text-zinc-500">
              Stage (for scoring)
              <select
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                value={stage}
                onChange={(e) => setStage(e.target.value as CallStage)}
              >
                {(["opening", "pitch", "discovery", "closing", "objection"] as CallStage[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* RIGHT — your reply + coach */}
        <section className="flex flex-col rounded-2xl border border-emerald-900/30 bg-black/40">
          <div className="border-b border-emerald-900/25 px-4 py-3">
            <h2 className="text-sm font-semibold text-emerald-300/90">Your reply</h2>
          </div>
          <textarea
            className="min-h-[200px] flex-1 resize-y border-0 bg-transparent px-4 py-4 text-base text-white outline-none placeholder:text-zinc-600"
            placeholder="Type your spoken reply as you would on a call…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!simState || simState.ended}
          />
          {feedback ? (
            <div className="space-y-3 border-t border-white/10 px-4 py-4 text-sm">
              <div className="flex flex-wrap gap-3 font-mono text-xs text-zinc-400">
                <span>Overall {feedback.overallScore}</span>
                <span>Clarity {feedback.clarityScore}</span>
                <span>Confidence {feedback.confidenceScore}</span>
                <span>Control {feedback.controlScore}</span>
              </div>
              <div>
                <p className="text-[11px] uppercase text-zinc-500">Worked well</p>
                <ul className="mt-1 list-disc pl-4 text-zinc-300">
                  {feedback.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase text-zinc-500">Improve</p>
                <ul className="mt-1 list-disc pl-4 text-zinc-300">
                  {feedback.improvements.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              {feedback.betterVersion ? (
                <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-300">
                  <span className="font-semibold text-emerald-400">Approved alternative: </span>
                  {feedback.betterVersion}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {/* BOTTOM controls */}
      <footer className="sticky bottom-4 z-10 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-xs text-zinc-400">
            Persona
            <select
              className="mt-2 min-w-[220px] rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value as SimulationPersonaId)}
            >
              {allowedPersonas.map((id) => (
                <option key={id} value={id}>
                  {id.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => start()}
            className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Start / reset scenario
          </button>
          <button
            type="button"
            disabled={!simState || simState.ended || !draft.trim()}
            onClick={() => submitReply()}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-500 disabled:opacity-40"
          >
            Submit reply
          </button>
          <p className="max-w-md text-xs text-zinc-500">
            Higher levels unlock tougher personas. Current training band:{" "}
            <strong className="text-zinc-300">{level}</strong> (
            {(level as TrainingLevel) === "elite" ? "full roster" : "progress by raising average score"}).
          </p>
        </div>
      </footer>
    </div>
  );
}
