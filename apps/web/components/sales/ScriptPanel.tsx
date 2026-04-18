"use client";

import { useState } from "react";

const SEGMENTS = ["host_bnhub", "broker", "seller", "buyer", "investor"] as const;
const CHANNELS = ["short_pitch", "long_pitch", "dm", "email", "call"] as const;

export function ScriptPanel({ marketDefault }: { marketDefault?: string }) {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>("host_bnhub");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("short_pitch");
  const [market, setMarket] = useState(marketDefault ?? "Montréal");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    setOut(null);
    try {
      const res = await fetch("/api/gtm/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, channel, market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOut(`${data.script?.title ?? ""}\n\n${data.script?.body ?? ""}`);
    } catch (e) {
      setOut(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-200">
      <h2 className="text-lg font-semibold text-white">GTM script</h2>
      <p className="mt-1 text-xs text-zinc-500">Draft only — review before send (consent / CASL / Law 25).</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
          value={segment}
          onChange={(e) => setSegment(e.target.value as (typeof SEGMENTS)[number])}
        >
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
          value={channel}
          onChange={(e) => setChannel(e.target.value as (typeof CHANNELS)[number])}
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          placeholder="Market"
        />
        <button
          type="button"
          disabled={loading}
          onClick={gen}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "…" : "Generate"}
        </button>
      </div>
      {out ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
          {out}
        </pre>
      ) : null}
    </div>
  );
}
