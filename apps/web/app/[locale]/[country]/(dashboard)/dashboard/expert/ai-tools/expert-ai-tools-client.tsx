"use client";

import { useState } from "react";

const ACTIONS: { id: string; label: string; hint: string }[] = [
  { id: "translate_fr", label: "→ French", hint: "Professional Canadian French" },
  { id: "translate_en", label: "→ English", hint: "Professional Canadian English" },
  { id: "polish_professional", label: "Polish tone", hint: "Client-ready, compliant wording" },
  { id: "expand_bio", label: "Expand bio", hint: "From notes to directory-style bio" },
  { id: "email_followup", label: "Email draft", hint: "Notes → subject + body" },
  { id: "summarize_for_client", label: "Client summary", hint: "Plain-language bullets" },
];

export function ExpertAiToolsClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function run(action: string) {
    setErr("");
    setResult("");
    if (!text.trim()) {
      setErr("Enter text first.");
      return;
    }
    setBusy(action);
    try {
      const res = await fetch("/api/mortgage/expert/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, text }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; result?: string };
      if (!res.ok) {
        setErr(j.error ?? "Request failed");
        return;
      }
      setResult(j.result ?? "");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#1e3a5f] bg-gradient-to-b from-[#0c1525] to-[#0a0f18] p-6 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/90">Gemini · drafting desk</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Your text</h2>
        <p className="mt-1 text-xs text-slate-500">
          Powered by Google Gemini when <code className="text-slate-400">GEMINI_API_KEY</code> is set. For drafts only —
          you remain responsible for regulatory accuracy.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste notes, a rough email, bilingual text, or bullet points…"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={Boolean(busy)}
              title={a.hint}
              onClick={() => void run(a.id)}
              className="rounded-lg border border-sky-500/35 bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-950/60 disabled:opacity-50"
            >
              {busy === a.id ? "…" : a.label}
            </button>
          ))}
        </div>
        {err ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {err}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1419] p-6">
        <h2 className="text-lg font-semibold text-white">Result</h2>
        <p className="mt-1 text-xs text-slate-500">Copy into your CRM, email, or profile — edit before sending.</p>
        <div className="mt-4 min-h-[280px] rounded-xl border border-white/10 bg-black/30 p-4">
          {result ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">{result}</pre>
          ) : (
            <p className="text-sm text-slate-600">Output appears here.</p>
          )}
        </div>
        {result ? (
          <button
            type="button"
            className="mt-4 text-xs font-semibold text-premium-gold hover:underline"
            onClick={() => void navigator.clipboard.writeText(result)}
          >
            Copy to clipboard
          </button>
        ) : null}
      </div>
    </div>
  );
}
