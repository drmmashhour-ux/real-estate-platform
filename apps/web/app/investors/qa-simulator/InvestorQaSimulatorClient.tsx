"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { evaluateAnswer, type AnswerFeedback } from "@/modules/investor-qa/feedback";
import {
  getQuestionsByCategory,
  INVESTOR_QA_QUESTIONS,
  pickRandomBatch,
  pickRandomQuestion,
} from "@/modules/investor-qa/question-bank";
import type { InvestorQaCategory, InvestorQaQuestion, PracticeMode } from "@/modules/investor-qa/investor-qa.types";

const CATEGORIES: { id: InvestorQaCategory; label: string }[] = [
  { id: "market", label: "Market" },
  { id: "product", label: "Product" },
  { id: "legal", label: "Legal / compliance" },
  { id: "traction", label: "Traction" },
  { id: "gtm", label: "GTM" },
  { id: "risk", label: "Risk" },
];

export function InvestorQaSimulatorClient() {
  const [mode, setMode] = useState<PracticeMode>("random");
  const [category, setCategory] = useState<InvestorQaCategory>("market");
  const [current, setCurrent] = useState<InvestorQaQuestion>(() => pickRandomQuestion());
  const [rapidList, setRapidList] = useState<InvestorQaQuestion[] | null>(null);
  const [rapidIndex, setRapidIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [rapidScores, setRapidScores] = useState<number[]>([]);

  const isRapid = mode === "rapid10";
  const idxLabel = isRapid && rapidList
    ? `${Math.min(rapidIndex + 1, rapidList.length)}/${rapidList.length}`
    : null;

  const resetRapid = useCallback(() => {
    const batch = pickRandomBatch(10);
    setRapidList(batch);
    setRapidIndex(0);
    setRapidScores([]);
    setCurrent(batch[0]!);
    setAnswer("");
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (mode === "random") {
      setCurrent(pickRandomQuestion());
      setRapidList(null);
      setAnswer("");
      setFeedback(null);
    } else if (mode === "category") {
      const list = getQuestionsByCategory(category);
      setCurrent(list[0] ?? pickRandomQuestion());
      setRapidList(null);
      setAnswer("");
      setFeedback(null);
    } else if (mode === "rapid10") {
      resetRapid();
    }
  }, [mode, category, resetRapid]);

  const nextInCategory = useCallback(() => {
    const list = getQuestionsByCategory(category);
    if (!list.length) return;
    const i = list.findIndex((q) => q.id === current.id);
    setCurrent(list[(i + 1) % list.length]!);
    setAnswer("");
    setFeedback(null);
  }, [category, current.id]);

  const onSubmit = useCallback(() => {
    if (!current) return;
    const fb = evaluateAnswer(answer, current.keyPoints, current.modelAnswer);
    setFeedback(fb);
    if (isRapid && rapidList) {
      setRapidScores((s) => [...s, fb.overallScore]);
    }
  }, [answer, current, isRapid, rapidList]);

  const nextRapid = useCallback(() => {
    if (!rapidList) return;
    if (rapidIndex + 1 >= rapidList.length) {
      setFeedback(null);
      setAnswer("");
      return;
    }
    const n = rapidIndex + 1;
    setRapidIndex(n);
    setCurrent(rapidList[n]!);
    setAnswer("");
    setFeedback(null);
  }, [rapidList, rapidIndex]);

  const newRandom = () => {
    setCurrent(pickRandomQuestion(current.id));
    setAnswer("");
    setFeedback(null);
  };

  const runningAvg = useMemo(() => {
    if (!rapidScores.length) return null;
    return Math.round((rapidScores.reduce((a, b) => a + b, 0) / rapidScores.length) * 10) / 10;
  }, [rapidScores]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-zinc-100">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/90">Founder prep</p>
        <h1 className="text-2xl font-semibold">Investor Q&amp;A — stress test</h1>
        <p className="text-sm text-zinc-400">
          Practice only. Scores are heuristic, not an investor grade. No legal, regulatory, or investment advice.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-sm">
        <span className="text-zinc-500">Mode:</span>
        {(
          [
            ["random", "Random"] as const,
            ["category", "By category"] as const,
            ["rapid10", "Rapid (10)"] as const,
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id as PracticeMode)}
            className={`rounded-lg px-3 py-1.5 ${
              mode === id ? "bg-amber-500/20 text-amber-200" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
        {mode === "category" && (
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-2 py-1.5"
            value={category}
            onChange={(e) => setCategory(e.target.value as InvestorQaCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        {isRapid && runningAvg != null && (
          <span className="text-xs text-cyan-300/90">Moyenne session: {runningAvg} / 10</span>
        )}
        {idxLabel && <span className="text-xs text-zinc-500">Question {idxLabel}</span>}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Question</h2>
          <p className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 text-base leading-relaxed text-zinc-100">
            {current.question}
          </p>
          <p className="text-[10px] uppercase text-zinc-500">
            {CATEGORIES.find((c) => c.id === current.category)?.label ?? current.category}
          </p>
          {mode === "random" && (
            <button
              type="button"
              onClick={newRandom}
              className="text-sm text-amber-400/90 hover:underline"
            >
              Autre question aléatoire
            </button>
          )}
          {mode === "category" && (
            <button
              type="button"
              onClick={nextInCategory}
              className="text-sm text-amber-400/90 hover:underline"
            >
              Question suivante (catégorie)
            </button>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Your answer</h2>
          <textarea
            className="min-h-[180px] w-full rounded-xl border border-zinc-600 bg-zinc-950/80 p-3 text-sm text-zinc-100"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your response as you would in a real meeting (FR or EN)…"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-100"
            >
              Get feedback
            </button>
            <button
              type="button"
              disabled
              title="Voice input coming later"
              className="cursor-not-allowed rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-500"
            >
              Voice (bientôt)
            </button>
            {isRapid && feedback && rapidList && rapidIndex + 1 < rapidList.length && (
              <button
                type="button"
                onClick={nextRapid}
                className="rounded-lg border border-cyan-700/50 bg-cyan-950/30 px-4 py-2 text-sm text-cyan-200/90"
              >
                Suivant →
              </button>
            )}
            {isRapid && feedback && rapidList && rapidIndex + 1 >= rapidList.length && (
              <button
                type="button"
                onClick={resetRapid}
                className="self-center text-sm text-emerald-300/90 underline"
              >
                Recommencer le rapid 10
              </button>
            )}
          </div>
        </section>
      </div>

      {feedback && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Feedback</h2>
          <div className="flex flex-wrap gap-4">
            <ScoreBox label="Overall" value={String(feedback.overallScore)} sub="/ 10" />
            <ScoreBox label="Clarity" value={String(feedback.clarityScore)} sub="/ 10" />
            <ScoreBox label="Completeness" value={String(feedback.completenessScore)} sub="/ 10" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium uppercase text-zinc-500">What to add</h3>
              <ul className="mt-1 list-disc pl-4 text-sm text-zinc-300">
                {feedback.whatToAdd.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase text-zinc-500">What to remove / trim</h3>
              <ul className="mt-1 list-disc pl-4 text-sm text-zinc-300">
                {feedback.whatToRemove.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          {feedback.missingPoints.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase text-amber-500/80">Points à mieux couvrir</h3>
              <ul className="mt-1 list-disc pl-4 text-sm text-amber-200/80">
                {feedback.missingPoints.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="text-xs font-medium uppercase text-zinc-500">Confiance (tips)</h3>
            <ul className="mt-1 list-disc pl-4 text-sm text-zinc-400">
              {feedback.confidenceTips.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase text-cyan-500/80">Exemple (tronc, aligné LECIPM)</h3>
            <p className="mt-1 text-sm leading-relaxed text-cyan-100/90">{feedback.improvedAnswerSample}</p>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 p-3 text-center text-xs text-zinc-600">
        {INVESTOR_QA_QUESTIONS.length} questions in bank · Québec + startup context
      </section>
    </div>
  );
}

function ScoreBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-[100px] rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="font-mono text-2xl text-zinc-50">
        {value}
        <span className="text-sm text-zinc-500">{sub}</span>
      </p>
    </div>
  );
}
