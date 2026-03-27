"use client";

import { useCallback, useState } from "react";

type TaskSlice = { completedCount: number; targetCount: number };

export function DailyContentCreator({
  contentTask,
  onMarkPosted,
}: {
  contentTask: TaskSlice | null;
  onMarkPosted: () => Promise<void>;
}) {
  const [topic, setTopic] = useState("");
  const [hook, setHook] = useState<string | null>(null);
  const [shortScript, setShortScript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hookAngle, setHookAngle] = useState<"mistake" | "loss" | "curiosity">("curiosity");
  const [betterHooks, setBetterHooks] = useState<string[] | null>(null);
  const [hooksLoading, setHooksLoading] = useState(false);

  const loadBetterHooks = useCallback(async () => {
    setHooksLoading(true);
    try {
      const res = await fetch("/api/daily-execution/better-hooks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angle: hookAngle }),
      });
      const data = (await res.json()) as { hooks?: string[] };
      setBetterHooks(Array.isArray(data.hooks) ? data.hooks : null);
    } catch {
      setBetterHooks(null);
    } finally {
      setHooksLoading(false);
    }
  }, [hookAngle]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-execution/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || undefined }),
      });
      const data = (await res.json()) as { hook?: string; shortScript?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setHook(data.hook ?? null);
      setShortScript(data.shortScript ?? null);
    } catch {
      setHook(null);
      setShortScript(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyShort() {
    if (shortScript) await navigator.clipboard.writeText(shortScript);
  }

  async function markPosted() {
    setBusy(true);
    try {
      await onMarkPosted();
    } finally {
      setBusy(false);
    }
  }

  const done = contentTask?.completedCount ?? 0;
  const target = contentTask?.targetCount ?? 1;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Daily content</h2>
      <p className="mt-1 text-xs text-slate-500">
        Uses the growth short-script helper when configured; you always publish manually.
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Posted today: {done} / {target}
      </p>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Optional topic / angle"
        className="mt-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="rounded-md bg-[#C9A646]/90 px-4 py-2 text-sm font-semibold text-black hover:bg-[#d4b456] disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate hook + script"}
        </button>
        {shortScript ? (
          <button
            type="button"
            onClick={() => void copyShort()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/5"
          >
            Copy script
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || done >= target}
          onClick={() => void markPosted()}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
        >
          Mark as posted
        </button>
      </div>
      {hook ? <p className="mt-4 text-sm font-medium text-[#C9A646]">Hook: {hook}</p> : null}
      {shortScript ? (
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
          {shortScript}
        </pre>
      ) : null}

      <div className="mt-6 border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-slate-200">Video hook lab</h3>
        <p className="mt-1 text-xs text-slate-500">Three improved hooks by angle — you pick one and record manually.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["curiosity", "mistake", "loss"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setHookAngle(a)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                hookAngle === a ? "bg-[#C9A646]/90 text-black" : "border border-white/15 text-slate-300 hover:bg-white/5"
              }`}
            >
              {a}
            </button>
          ))}
          <button
            type="button"
            disabled={hooksLoading}
            onClick={() => void loadBetterHooks()}
            className="rounded-md border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {hooksLoading ? "…" : "Generate 3 hooks"}
          </button>
        </div>
        {betterHooks ? (
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            {betterHooks.map((h, i) => (
              <li key={i} className="flex gap-2 rounded-md border border-white/10 bg-black/25 p-2">
                <span className="shrink-0 font-medium text-[#C9A646]">{i + 1}.</span>
                <span className="flex-1">{h}</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(h)}
                  className="shrink-0 text-slate-500 hover:text-slate-300"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
