"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CloserModePanel } from "@/components/closing/CloserModePanel";
import { PsychologyCoachPanel } from "@/components/sales-psychology/PsychologyCoachPanel";
import { recordCloserSessionEnd } from "@/modules/closing";
import { buildClosingCoachBundle } from "@/modules/personality-closing/personality-response.service";
import { recordPersonalityOutcome } from "@/modules/personality-closing/personality-learning.service";
import { recordPsychologyOutcome } from "@/modules/sales-psychology/psychology-learning.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import type { ScriptAudience } from "@/modules/sales-scripts/sales-script.types";
import { evaluateLiveTurn } from "@/modules/live-training/live-feedback.engine";
import {
  appendUserTurn,
  buildSessionSummary,
  exportSessionsJson,
  loadAggregateProgress,
  paceLevelFromRollingAvg,
  saveSessionRecord,
  startLiveSession,
  unlockedLivePersonas,
} from "@/modules/live-training/live-training.service";
import type { LivePersonaType, LiveSessionState, SessionSummary } from "@/modules/live-training/live-training.types";
import {
  appendScenarioUserTurn,
  getScenarioById,
  hardestScenarios,
  improvementTrend,
  isDifficultyUnlocked,
  listScenarios,
  maxUnlockedDifficulty,
  recordScenarioSession,
  scoreScenarioTurn,
  startScenarioLiveSession,
} from "@/modules/training-scenarios";
import type { ScenarioDifficulty, TrainingScenario } from "@/modules/training-scenarios";

type Graded = {
  text: string;
  feedback: ReturnType<typeof evaluateLiveTurn>;
  scenarioComposite?: number;
};

export function TrainingLiveClient({
  dashBase,
  adminBase,
}: {
  dashBase: string;
  adminBase: string;
}) {
  const [persona, setPersona] = useState<LivePersonaType>("driver_broker");
  const [session, setSession] = useState<LiveSessionState | null>(null);
  const [draft, setDraft] = useState("");
  const [graded, setGraded] = useState<Graded[]>([]);
  const [lastFb, setLastFb] = useState<ReturnType<typeof evaluateLiveTurn> | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [interruptBanner, setInterruptBanner] = useState<string | null>(null);
  const [practiceDraft, setPracticeDraft] = useState("");
  const [practiceFb, setPracticeFb] = useState<ReturnType<typeof evaluateLiveTurn> | null>(null);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const [closerMode, setCloserMode] = useState(true);
  const [trainingHubMode, setTrainingHubMode] = useState<"free" | "scenario">("free");
  const [scenarioDifficultyFilter, setScenarioDifficultyFilter] = useState<ScenarioDifficulty | "ALL">("ALL");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rollup, setRollup] = useState(() =>
    typeof window !== "undefined" ? loadAggregateProgress() : { sessionCount: 0, rollingAverageScore: 0, lastPersona: null },
  );
  const paceLevel = paceLevelFromRollingAvg(rollup.rollingAverageScore);
  const unlocked = unlockedLivePersonas(rollup.rollingAverageScore, rollup.sessionCount ?? 0);

  const progressSnap = useMemo(
    () => ({
      rollingAverageScore: rollup.rollingAverageScore,
      sessionCount: rollup.sessionCount ?? 0,
    }),
    [rollup.rollingAverageScore, rollup.sessionCount],
  );

  const filteredScenarios = useMemo((): TrainingScenario[] => {
    if (scenarioDifficultyFilter === "ALL") return listScenarios();
    return listScenarios({ difficulty: scenarioDifficultyFilter });
  }, [scenarioDifficultyFilter]);

  const previewScenario = useMemo(
    () => (selectedScenarioId ? getScenarioById(selectedScenarioId) : undefined),
    [selectedScenarioId],
  );

  const maxUnlock = useMemo(() => maxUnlockedDifficulty(progressSnap), [progressSnap]);

  const hubAnalytics = useMemo(
    () => ({
      trend: improvementTrend(),
      hardest: hardestScenarios(3),
    }),
    [rollup.sessionCount, session?.ended],
  );

  const resetTimer = useCallback((sec: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(sec);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimedOut(true);
          setInterruptBanner("Time’s up — persona may interrupt.");
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const begin = useCallback(() => {
    let s: LiveSessionState;
    if (trainingHubMode === "scenario" && selectedScenarioId) {
      const sc = getScenarioById(selectedScenarioId);
      if (!sc || !isDifficultyUnlocked(sc.difficulty, progressSnap)) return;
      s = startScenarioLiveSession(sc);
    } else {
      s = startLiveSession(persona, paceLevel);
    }
    setSession(s);
    setGraded([]);
    setLastFb(null);
    setDraft("");
    setTimedOut(false);
    setInterruptBanner(null);
    setLastSummary(null);
    resetTimer(s.config.secondsPerTurn);
  }, [persona, paceLevel, resetTimer, trainingHubMode, selectedScenarioId, progressSnap]);

  useEffect(() => {
    if (session && !session.ended && session.messages.length > 0) {
      const sec = session.config.secondsPerTurn;
      resetTimer(sec);
      setTimedOut(false);
      setInterruptBanner(null);
    }
  }, [session?.messages.length, session?.ended, resetTimer]);

  const submit = useCallback(() => {
    if (!session || session.ended || !draft.trim()) return;
    const step = session.scenarioId
      ? appendScenarioUserTurn(session, draft, timedOut)
      : appendUserTurn(session, draft, timedOut);
    const words = draft.trim().split(/\s+/).filter(Boolean).length;
    const dim = scoreScenarioTurn(step.feedback, words);
    const newGraded = [
      ...graded,
      { text: draft.trim(), feedback: step.feedback, scenarioComposite: dim.composite },
    ];
    setSession(step.state);
    setGraded(newGraded);
    setLastFb(step.feedback);
    if (step.interruptLine) setInterruptBanner("Interrupt: stay calm and answer the objection.");
    setDraft("");
    setTimedOut(false);

    if (step.state.ended) {
      if (timerRef.current) clearInterval(timerRef.current);
      const personaForSummary = session.scenarioId
        ? getScenarioById(session.scenarioId)?.livePersona ?? persona
        : persona;
      const summary = buildSessionSummary(
        personaForSummary,
        newGraded.map(({ text, feedback }) => ({ text, feedback })),
        step.state.sessionId,
        step.state.scenarioId,
      );
      setLastSummary(summary);
      saveSessionRecord(summary);
      const lastPersonaLine = [...step.state.messages].reverse().find((m) => m.role === "persona")?.text ?? "";
      const coach = buildClosingCoachBundle(lastPersonaLine.trim());
      if (coach && step.state.outcome) {
        const won = step.state.outcome === "won";
        recordPsychologyOutcome(coach.strategyKey, coach.detection.primaryState, won);
        recordPersonalityOutcome(coach.personality.primary, coach.strategyKey, won);
        recordCloserSessionEnd(won, coach.personality.primary);
      } else if (step.state.outcome) {
        recordCloserSessionEnd(step.state.outcome === "won");
      }
      if (step.state.scenarioId && step.state.outcome) {
        const comps = newGraded
          .map((g) => g.scenarioComposite)
          .filter((x): x is number => typeof x === "number");
        const avgC = comps.length ? Math.round(comps.reduce((a, b) => a + b, 0) / comps.length) : 0;
        recordScenarioSession(step.state.scenarioId, avgC, step.state.outcome === "won");
      }
      setRollup(loadAggregateProgress());
      void fetch("/api/live-training/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      }).catch(() => {});
    }
  }, [session, draft, timedOut, persona, graded]);

  const runningAvg = useMemo(() => {
    if (graded.length > 0) {
      return Math.round(graded.reduce((a, t) => a + t.feedback.score, 0) / graded.length);
    }
    return lastFb?.score ?? 0;
  }, [graded, lastFb]);

  const lastSimulatedClient = useMemo(() => {
    if (!session) return "";
    const fromPersona = [...session.messages].reverse().find((m) => m.role === "persona");
    return fromPersona?.text ?? "";
  }, [session]);

  const lastUserSaid = useMemo(() => {
    if (!session) return "";
    const u = [...session.messages].reverse().find((m) => m.role === "user");
    return u?.text ?? "";
  }, [session]);

  const activeScenarioDef = useMemo(
    () => (session?.scenarioId ? getScenarioById(session.scenarioId) : undefined),
    [session?.scenarioId],
  );

  const trainingAudience = useMemo((): ScriptAudience => {
    if (activeScenarioDef) return activeScenarioDef.type;
    if (persona === "expressive_user" || persona.endsWith("_investor")) return "INVESTOR";
    return "BROKER";
  }, [persona, activeScenarioDef]);

  const trainingCallStage = useMemo((): CallStage => {
    if (!session) return "opening";
    if (session.ended) return "closing";
    if (session.turn >= 5) return "closing";
    if (session.turn >= 2) return "discovery";
    if (lastSimulatedClient && /\b(not interested|busy|email)\b/i.test(lastSimulatedClient)) return "objection";
    return "pitch";
  }, [session, lastSimulatedClient]);

  const drillPractice = useCallback(() => {
    if (!practiceDraft.trim() || !session) return;
    const fb = evaluateLiveTurn(practiceDraft, session.config.personaType, session.tension);
    setPracticeFb(fb);
  }, [practiceDraft, session]);

  const personaLocked = (p: LivePersonaType) => !unlocked.includes(p);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-950 text-white">
      <div className="border-b border-white/10 bg-black/50 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">Live training</p>
            <p className="mt-1 font-mono text-2xl font-semibold">
              Score <span className="text-emerald-400">{runningAvg || "—"}</span>
              <span className="ml-6 text-base font-normal text-zinc-500">
                Timer{" "}
                <span className={`font-mono text-white ${secondsLeft <= 8 ? "text-amber-400" : ""}`}>
                  {session && !session.ended ? `${secondsLeft}s` : "—"}
                </span>
              </span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Pace L{paceLevel} · Rolling avg {rollup.rollingAverageScore.toFixed(1)} · Sessions {rollup.sessionCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link href={`${adminBase}/training`} className="text-zinc-400 underline">
              Scenario lab
            </Link>
            <Link href={`${dashBase}/call-live`} className="text-zinc-400 underline">
              Live desk
            </Link>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-zinc-300 hover:bg-white/5"
              onClick={() => {
                const blob = new Blob([exportSessionsJson()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `live-training-sessions.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export sessions JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 pt-4">
        <div className="rounded-2xl border border-sky-900/35 bg-sky-950/15 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/90">Structured scenarios</p>
              <p className="mt-1 text-xs text-zinc-500">
                Progressive objection injection · unlock harder tiers as your rolling score rises (max unlocked:{" "}
                <span className="text-zinc-300">{maxUnlock}</span>).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  trainingHubMode === "free" ? "bg-emerald-700 text-white" : "border border-white/15 text-zinc-400"
                }`}
                disabled={Boolean(session && !session.ended)}
                onClick={() => setTrainingHubMode("free")}
              >
                Free play
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  trainingHubMode === "scenario" ? "bg-sky-700 text-white" : "border border-white/15 text-zinc-400"
                }`}
                disabled={Boolean(session && !session.ended)}
                onClick={() => setTrainingHubMode("scenario")}
              >
                Scenario lab
              </button>
            </div>
          </div>

          {trainingHubMode === "scenario" ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "EASY", "MEDIUM", "HARD", "EXTREME"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={Boolean(session && !session.ended)}
                      onClick={() => {
                        setScenarioDifficultyFilter(d);
                        setSelectedScenarioId("");
                      }}
                      className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${
                        scenarioDifficultyFilter === d ? "bg-sky-600 text-white" : "bg-black/40 text-zinc-500"
                      }`}
                    >
                      {d === "ALL" ? "All" : d.toLowerCase()}
                    </button>
                  ))}
                </div>
                <label className="block text-xs text-zinc-400">
                  Scenario
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                    value={selectedScenarioId}
                    disabled={Boolean(session && !session.ended)}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {filteredScenarios.map((sc) => {
                      const ok = isDifficultyUnlocked(sc.difficulty, progressSnap);
                      return (
                        <option key={sc.id} value={sc.id} disabled={!ok}>
                          [{sc.difficulty}] {sc.title} {!ok ? "(locked)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-4 text-sm">
                {previewScenario ? (
                  <>
                    <p className="font-semibold text-white">{previewScenario.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">{previewScenario.description}</p>
                    <p className="mt-3 text-xs text-sky-200/90">
                      <span className="text-zinc-500">Goal · </span>
                      {previewScenario.goal}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-zinc-300">{previewScenario.type}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-zinc-300">
                        {previewScenario.personality}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-zinc-400">
                        Voice: {previewScenario.livePersona.replace(/_/g, " ")}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">Pick a scenario to see the briefing.</p>
                )}
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-[11px] text-zinc-600">
            Analytics · composite trend {hubAnalytics.trend.improving ? "↑" : "→"} {hubAnalytics.trend.delta} · hardest:{" "}
            {hubAnalytics.hardest.length === 0
              ? "—"
              : hubAnalytics.hardest.map((h) => `${h.id.slice(0, 18)}…`).join(", ")}
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 p-6 lg:grid-cols-2">
        {/* LEFT chat */}
        <section className="flex min-h-[420px] flex-col rounded-2xl border border-white/10 bg-black/35">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-zinc-400">
                Persona
                <select
                  className="ml-2 rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-white"
                  value={persona}
                  disabled={Boolean(session && !session.ended) || trainingHubMode === "scenario"}
                  onChange={(e) => setPersona(e.target.value as LivePersonaType)}
                >
                  {(
                    [
                      "driver_broker",
                      "analytical_investor",
                      "expressive_user",
                      "amiable_client",
                    ] as LivePersonaType[]
                  ).map((p) => (
                    <option key={p} value={p} disabled={personaLocked(p)}>
                      {p.replace(/_/g, " ")}
                      {personaLocked(p) ? " (locked)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => begin()}
                disabled={
                  Boolean(session && !session.ended) ||
                  (!session &&
                    trainingHubMode === "scenario" &&
                    (!selectedScenarioId ||
                      !previewScenario ||
                      !isDifficultyUnlocked(previewScenario.difficulty, progressSnap)))
                }
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                {session ? "Restart" : "Start"}
              </button>
            </div>
            {interruptBanner ? (
              <p className="mt-2 rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-100">{interruptBanner}</p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 font-mono text-sm">
            {(session?.messages ?? []).map((m, i) => (
              <div
                key={`${m.atMs}-${i}`}
                className={`max-w-[95%] rounded-xl px-4 py-3 ${
                  m.role === "persona"
                    ? "self-start border border-white/10 bg-zinc-900/80 text-zinc-100"
                    : "self-end border border-emerald-900/40 bg-emerald-950/40 text-emerald-50"
                }`}
              >
                <span className="mb-1 block text-[10px] uppercase text-zinc-500">{m.role}</span>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            ))}
            {!session ? <p className="text-zinc-500">Press Start — reply fast; interruptions fire under pressure.</p> : null}
          </div>
        </section>

        {/* RIGHT */}
        <section className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={closerMode}
              onChange={(e) => setCloserMode(e.target.checked)}
              className="rounded border-white/20 bg-black"
            />
            Closer mode (flow + hooks)
          </label>
          {closerMode ? (
            <CloserModePanel
              callStage={trainingCallStage}
              audience={trainingAudience}
              lastProspectInput={lastSimulatedClient}
              lastRepSample={lastUserSaid}
              compact
            />
          ) : null}
          <PsychologyCoachPanel clientText={lastSimulatedClient} compact />

          <div className="rounded-2xl border border-emerald-900/35 bg-black/45 p-5">
            <h2 className="text-sm font-semibold text-emerald-300/90">Your reply</h2>
            <textarea
              className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-base text-white outline-none"
              placeholder="What you say on the call…"
              value={draft}
              disabled={!session || session.ended}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!session || session.ended}
                onClick={() => {
                  const SR =
                    typeof window !== "undefined"
                      ? ((window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ??
                        (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition)
                      : undefined;
                  if (!SR) return;
                  const rec = new SR();
                  rec.lang = "en-US";
                  rec.onresult = (ev: SpeechRecognitionEvent) => {
                    const t = ev.results[0]?.[0]?.transcript?.trim();
                    if (t) setDraft((d) => (d ? `${d} ${t}` : t));
                  };
                  rec.start();
                }}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                Voice input
              </button>
              <button
                type="button"
                disabled={!session || session.ended || !draft.trim()}
                onClick={() => submit()}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-500 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>

          {lastFb ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-sm">
              <p className="font-mono text-xs text-zinc-500">
                Score {lastFb.score} · {lastFb.tags.join(", ") || "no tags"}
              </p>
              <p className="mt-3 text-amber-100/90">{lastFb.quickFix}</p>
              {lastFb.betterVersion ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 text-zinc-200">
                  <p className="text-[11px] uppercase text-zinc-500">Better version</p>
                  <p className="mt-1">{lastFb.betterVersion}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white"
                    onClick={() => setDraft(lastFb.betterVersion ?? "")}
                  >
                    Insert into reply
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <h3 className="text-sm font-semibold text-white">Drill same moment</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Practice an improved line without advancing the simulation.
            </p>
            <textarea
              className="mt-3 min-h-[72px] w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              placeholder="Rewrite your line…"
              value={practiceDraft}
              onChange={(e) => setPracticeDraft(e.target.value)}
            />
            <button
              type="button"
              className="mt-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white"
              onClick={() => drillPractice()}
            >
              Grade practice only
            </button>
            {practiceFb ? (
              <p className="mt-3 text-xs text-zinc-400">
                Practice score {practiceFb.score} — {practiceFb.quickFix}
              </p>
            ) : null}
          </div>

          {session?.ended && lastSummary ? (
            <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-5 text-sm">
              <p className="font-semibold text-emerald-200">
                Session ended ({session.outcome ?? "done"}) · avg {lastSummary.averageScore}
              </p>
              <div className="mt-3 grid gap-2 text-xs text-zinc-300">
                <p>
                  <span className="text-zinc-500">Strengths:</span> {lastSummary.strengths.join(" · ")}
                </p>
                <p>
                  <span className="text-zinc-500">Watch:</span> {lastSummary.weaknesses.join(" · ")}
                </p>
                {lastSummary.topMistakes.length > 0 ? (
                  <p>
                    <span className="text-zinc-500">Tags:</span> {lastSummary.topMistakes.join(", ")}
                  </p>
                ) : null}
                {lastSummary.bestLines.length > 0 ? (
                  <p>
                    <span className="text-zinc-500">Best lines:</span> {lastSummary.bestLines.join(" | ")}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Saved locally + optional server ping. Restart to train again.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  start(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
