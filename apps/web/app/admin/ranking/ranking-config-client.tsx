"use client";

import { useState, useEffect } from "react";

const WEIGHT_KEYS = [
  "verification",
  "superHost",
  "hostQualityScore",
  "reviewScore",
  "reviewCount",
  "conversion",
];

export function RankingConfigClient({
  initialWeights,
}: {
  initialWeights: Record<string, number>;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWeights(initialWeights);
  }, [initialWeights]);

  function setWeight(key: string, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/bnhub/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      if (res.ok) {
        const updated = await res.json();
        setWeights(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <ul className="space-y-3">
        {WEIGHT_KEYS.map((key) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-slate-300">{key}</label>
            <input
              type="number"
              step="0.5"
              min={0}
              value={weights[key] ?? 0}
              onChange={(e) => setWeight(key, parseFloat(e.target.value) || 0)}
              className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save weights"}
      </button>
    </div>
  );
}
