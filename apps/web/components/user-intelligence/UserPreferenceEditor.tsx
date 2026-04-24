"use client";

import { useState } from "react";

type Props = { onSaved?: () => void };

/**
 * Add a single explicit string preference as a `UserPreferenceSignal` (product use only).
 */
export function UserPreferenceEditor({ onSaved }: Props) {
  const [key, setKey] = useState("housing_intent");
  const [val, setVal] = useState("buy");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user-intelligence/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalKey: key,
          signalValue: val,
          sourceDomain: "ACCOUNT",
          sourceType: "user_edit",
          explicitUserProvided: true,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) {
        setErr(j.error ?? "Could not save");
        return;
      }
      onSaved?.();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-semibold text-white">Add explicit preference</h3>
      <p className="text-xs text-slate-500">Keys must be product-related (e.g. housing, budget, city, style). We reject unsafe keys server-side.</p>
      <label className="block text-xs text-slate-400">
        Key
        <input
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </label>
      <label className="block text-xs text-slate-400">
        Value
        <input
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </label>
      {err && <p className="text-sm text-rose-400">{err}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-premium-gold/90 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preference signal"}
      </button>
    </div>
  );
}
