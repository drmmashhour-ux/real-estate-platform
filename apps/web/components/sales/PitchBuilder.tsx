"use client";

import { useState } from "react";

const SEGMENTS = ["host_bnhub", "broker", "seller", "buyer", "investor"] as const;

export function PitchBuilder({ marketDefault }: { marketDefault?: string }) {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>("broker");
  const [market, setMarket] = useState(marketDefault ?? "Montréal");
  const [out, setOut] = useState<unknown>(null);

  async function gen() {
    setOut(null);
    const res = await fetch("/api/gtm/pitch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segment, market }),
    });
    const data = await res.json();
    setOut(data.ok ? data.pitch : data.error ?? "Error");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-200">
      <h2 className="text-lg font-semibold text-white">Pitch outline</h2>
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
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
        />
        <button type="button" onClick={gen} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white">
          Generate
        </button>
      </div>
      {out ? (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-4 text-sm">
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
