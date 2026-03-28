"use client";

import { useState } from "react";

type Props = {
  listingId?: string;
  leadId?: string;
};

export function AICopilotChat({ listingId, leadId }: Props) {
  const [q, setQ] = useState("Is this a good deal?");
  const [answer, setAnswer] = useState<string>("");
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, listingId, leadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Copilot failed");
      setAnswer(data.answer);
      setActions(Array.isArray(data.nextActions) ? data.nextActions : []);
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : "Copilot failed");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/40">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI Copilot</h3>
      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-white/20 dark:bg-slate-950"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-premium-gold dark:text-black"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
      {answer ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{answer}</p> : null}
      {actions.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
