"use client";

import * as React from "react";

import type { AiAssistSuggestion } from "@/modules/growth/ai-assisted-execution.types";

const STORAGE_PREFIX = "lec-scale-engine-v2-ai";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    const a = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(a) ? (a as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function AiExecutionPanel() {
  const [suggestions, setSuggestions] = React.useState<AiAssistSuggestion[]>([]);
  const [governanceNote, setGovernanceNote] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = React.useState<Set<string>>(new Set());
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setDismissed(loadSet(`${STORAGE_PREFIX}:dismissed`));
    setAcknowledged(loadSet(`${STORAGE_PREFIX}:ack`));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/ai-assist-execution", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as {
          suggestions?: AiAssistSuggestion[];
          governanceNote?: string | null;
          error?: string;
        };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setSuggestions(j.suggestions ?? []);
        setGovernanceNote(j.governanceNote ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function ignore(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(`${STORAGE_PREFIX}:dismissed`, next);
      return next;
    });
  }

  function acknowledge(id: string) {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(`${STORAGE_PREFIX}:ack`, next);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading AI-assisted execution…</p>
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <section
      className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-4"
      data-growth-ai-assist-execution-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">AI-assisted execution (V2)</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Safe scale suggestions</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Draft-only — copy or acknowledge locally. Nothing sends automatically; approval does not trigger backend
          execution.
        </p>
      </div>
      {governanceNote ? (
        <p className="mt-3 rounded-md border border-amber-800/50 bg-amber-950/30 p-2 text-sm text-amber-200/90">
          {governanceNote}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {visible.length === 0 ? (
          <li className="text-sm text-zinc-500">No active suggestions (all ignored or governance hold).</li>
        ) : (
          visible.map((s) => (
            <li key={s.id} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase text-violet-400/90">{s.type.replace(/_/g, " ")}</span>
                <span className="text-[11px] text-zinc-500">
                  Confidence {(s.confidence * 100).toFixed(0)}% ·{" "}
                  {s.requiresApproval ? "Approval recommended" : "Review"}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{s.suggestion}</p>
              {acknowledged.has(s.id) ? (
                <p className="mt-2 text-[11px] text-emerald-500/90">Acknowledged locally — no server action.</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyButton text={s.suggestion} />
                <button
                  type="button"
                  className="rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900/50"
                  onClick={() => acknowledge(s.id)}
                >
                  Approve (local)
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                  onClick={() => ignore(s.id)}
                >
                  Ignore
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
