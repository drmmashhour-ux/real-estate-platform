"use client";

import { useState } from "react";
import type { FounderCopilotRunResult } from "@/modules/founder-copilot/founder-copilot.types";

export function FounderQuestionBox({
  onAnswered,
}: {
  onAnswered?: () => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<FounderCopilotRunResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/founder/copilot/question", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, window: "30d" }),
      });
      const json = (await res.json()) as { result?: FounderCopilotRunResult; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      if (json.result) {
        setAnswer(json.result);
        onAnswered?.();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Question exécutive</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Réponses basées sur les agrégats internes — pas de causes inventées.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="flex-1 rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex. Quel goulot d’étranglement cette semaine ?"
        />
        <button
          type="button"
          className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? "…" : "Demander"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      {answer?.answer && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-200">
          <div className="font-medium">{answer.answer.title}</div>
          <p className="mt-1 text-zinc-400">{answer.answer.summary}</p>
        </div>
      )}
    </div>
  );
}
