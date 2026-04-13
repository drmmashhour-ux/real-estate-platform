"use client";

import { useState } from "react";
import Link from "next/link";

export default function DictationCorrectionPage() {
  const [text, setText] = useState("");
  const [corrected, setCorrected] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCorrect() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dictation-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to correct");
      setCorrected(data.corrected);
      setChanges(data.changes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCorrected("");
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }

  function copyCorrected() {
    if (corrected) {
      navigator.clipboard.writeText(corrected);
    }
  }

  function useCorrected() {
    if (corrected) {
      setText(corrected);
      setCorrected("");
      setChanges([]);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/tools/design-studio"
            className="text-sm text-slate-400 hover:text-emerald-400"
          >
            ← Tools
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dictation correction
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Paste or type text from speech-to-text and fix common errors: duplicate words, spoken punctuation (e.g. &quot;comma&quot; → ,), sentence capitalization, and common typos.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Your text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: I would like to see the the property comma it has three bedrooms period"
              rows={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCorrect}
                disabled={loading || !text.trim()}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? "Correcting…" : "Correct dictation"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {corrected && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-emerald-400">
                  Corrected text
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCorrected}
                    className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={useCorrected}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                  >
                    Use in box above
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                {corrected}
              </p>
              {changes.length > 0 && (
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <p className="text-xs font-medium text-slate-500">
                    Changes made ({changes.length})
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                    {changes.slice(0, 15).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                    {changes.length > 15 && (
                      <li>… and {changes.length - 15} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300">What gets corrected</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>Duplicate words (e.g. &quot;the the&quot; → &quot;the&quot;)</li>
            <li>Spoken punctuation: &quot;comma&quot;, &quot;period&quot;, &quot;question mark&quot;, &quot;new line&quot;, etc.</li>
            <li>Common typos: &quot;teh&quot; → &quot;the&quot;, &quot;adn&quot; → &quot;and&quot;, &quot;recieve&quot; → &quot;receive&quot;, and more</li>
            <li>Capitalization after . ? !</li>
            <li>Period at end of sentence when missing</li>
            <li>Extra spaces and line breaks normalized</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
