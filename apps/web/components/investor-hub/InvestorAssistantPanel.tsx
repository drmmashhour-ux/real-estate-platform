"use client";

import { useCallback, useState } from "react";

type Action = "summarize_metrics" | "suggest_answer" | "pitch_line";

export function InvestorAssistantPanel() {
  const [action, setAction] = useState<Action>("summarize_metrics");
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState("marketplace");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setOut(null);
    try {
      const res = await fetch("/api/admin/investor-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          question: action === "suggest_answer" ? question : undefined,
          draft: action === "suggest_answer" ? draft : undefined,
          topic: action === "pitch_line" ? topic : undefined,
        }),
      });
      const j = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Request failed");
      setOut(j.text ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [action, question, draft, topic]);

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-950 to-black p-6 shadow-lg shadow-amber-950/20">
      <h2 className="font-serif text-lg text-amber-200">Investor assistant</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Summarize live metrics, tighten an answer, or generate a single pitch line. Uses OpenAI when configured.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["summarize_metrics", "Summarize metrics"],
            ["suggest_answer", "Suggest answer"],
            ["pitch_line", "Pitch line"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAction(id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              action === id ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {action === "suggest_answer" ? (
        <div className="mt-4 space-y-2">
          <input
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            placeholder="Investor question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            placeholder="Your draft (optional)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      ) : null}
      {action === "pitch_line" ? (
        <input
          className="mt-4 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200"
          placeholder="Topic focus"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      ) : null}
      <button
        type="button"
        disabled={loading || (action === "suggest_answer" && !question.trim())}
        onClick={() => void run()}
        className="mt-4 rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-40"
      >
        {loading ? "Working…" : "Generate"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
      {out ? (
        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 text-xs text-zinc-300">
          {out}
        </pre>
      ) : null}
    </section>
  );
}
