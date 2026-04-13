"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type Q = { id: string; question: string; category: string; difficulty: string };

type Eval = {
  score: number;
  feedback: string;
  improvedAnswer: string;
  dimensions: { clarity: number; credibility: number; completeness: number; confidence: number };
};

export function InvestorSimulationClient() {
  const [count, setCount] = useState(5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastEval, setLastEval] = useState<Eval | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; eval: Eval }>>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = questions[idx];

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setHistory([]);
    setLastEval(null);
    try {
      const res = await fetch("/api/admin/investor-simulation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const j = (await res.json()) as {
        sessionId?: string;
        questions?: Q[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Start failed");
      setSessionId(j.sessionId ?? null);
      setQuestions(Array.isArray(j.questions) ? j.questions : []);
      setIdx(0);
      setAnswer("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [count]);

  const submitAnswer = useCallback(async () => {
    if (!sessionId || !current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/investor-simulation/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: current.id, userAnswer: answer }),
      });
      const j = (await res.json()) as Eval & { error?: string; dimensions?: Eval["dimensions"] };
      if (!res.ok) throw new Error(j.error ?? "Submit failed");
      const ev: Eval = {
        score: j.score,
        feedback: j.feedback,
        improvedAnswer: j.improvedAnswer,
        dimensions: j.dimensions ?? {
          clarity: j.score,
          credibility: j.score,
          completeness: j.score,
          confidence: j.score,
        },
      };
      setLastEval(ev);
      setHistory((h) => [...h, { question: current.question, eval: ev }]);
      setAnswer("");
      if (idx + 1 >= questions.length) {
        const res2 = await fetch("/api/admin/investor-simulation/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const done = (await res2.json()) as { feedback?: string; error?: string };
        if (!res2.ok) throw new Error(done.error ?? "Complete failed");
        setSummary(done.feedback ?? null);
        setSessionId(null);
        setQuestions([]);
      } else {
        setIdx((i) => i + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [sessionId, current, answer, idx, questions.length]);

  const pct = (n: number) => Math.min(100, Math.max(0, n));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-500/25 bg-zinc-950/80 p-6">
        <h2 className="font-serif text-lg text-amber-100">Practice session</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Random questions from your investor Q&amp;A bank. Answers are scored 0–100 with feedback (OpenAI when configured).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-sm text-zinc-400">
            Questions
            <input
              type="number"
              min={3}
              max={12}
              className="ml-2 w-16 rounded border border-zinc-800 bg-black px-2 py-1 text-amber-100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 5)}
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void start()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
          >
            {loading ? "…" : "Start session"}
          </button>
          <Link href="/admin/investor/qa" className="text-xs text-amber-400/80 hover:underline">
            Manage Q&amp;A bank →
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {sessionId && current ? (
        <div className="rounded-2xl border border-amber-500/20 bg-black/60 p-6">
          <p className="text-xs text-zinc-500">
            Question {idx + 1} / {questions.length}
          </p>
          <span className="mt-2 inline-block rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] uppercase text-amber-200/80">
            {current.category} · {current.difficulty}
          </span>
          <p className="mt-4 text-lg font-medium text-amber-50">{current.question}</p>
          <textarea
            className="mt-4 min-h-[140px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200"
            placeholder="Type your answer…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            type="button"
            disabled={loading || !answer.trim()}
            onClick={() => void submitAnswer()}
            className="mt-4 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            Submit &amp; score
          </button>
        </div>
      ) : null}

      {lastEval && sessionId ? (
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-emerald-200/90">Score: {lastEval.score}</p>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>Clarity {lastEval.dimensions.clarity}</span>
              <span>Credibility {lastEval.dimensions.credibility}</span>
              <span>Complete {lastEval.dimensions.completeness}</span>
              <span>Confidence {lastEval.dimensions.confidence}</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900">
            <div className="h-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all" style={{ width: `${pct(lastEval.score)}%` }} />
          </div>
          <p className="mt-4 text-sm text-zinc-300">{lastEval.feedback}</p>
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-amber-400/90">Suggested improved answer</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{lastEval.improvedAnswer}</p>
          </details>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-black p-6">
          <h3 className="font-serif text-lg text-amber-100">Session complete</h3>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-zinc-400">{summary}</pre>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="rounded-2xl border border-zinc-800 p-6">
          <h3 className="text-sm font-semibold text-zinc-400">Round log</h3>
          <ul className="mt-3 space-y-3">
            {history.map((h, i) => (
              <li key={i} className="rounded-lg border border-zinc-900 bg-black/40 px-3 py-2 text-sm">
                <span className="text-amber-500/90">{h.eval.score}</span> — {h.question.slice(0, 80)}
                {h.question.length > 80 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
