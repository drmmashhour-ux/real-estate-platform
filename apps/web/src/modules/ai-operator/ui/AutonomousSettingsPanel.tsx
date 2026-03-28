"use client";

import { useCallback, useEffect, useState } from "react";

const MODES = [
  { id: "manual", label: "Manual", desc: "All actions stay suggested until you approve." },
  { id: "assisted", label: "Assisted", desc: "Same as manual today — future: ranked bundles." },
  {
    id: "auto_restricted",
    label: "Auto (restricted)",
    desc: "Only safe actions (e.g. run_simulation hints) auto-complete; no messages or billing.",
  },
] as const;

export function AutonomousSettingsPanel() {
  const [mode, setMode] = useState<string>("manual");
  const [allowed, setAllowed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lecipm/ai-operator/settings");
      const data = await res.json();
      setMode(data.autonomyMode ?? "manual");
      setAllowed(data.allowedModes ?? []);
    } catch {
      setMode("manual");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: string) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/lecipm/ai-operator/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autonomyMode: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMode(data.autonomyMode);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <h2 className="text-sm font-semibold text-white">Autonomy</h2>
      <p className="mt-1 text-xs text-slate-500">Controlled modes only — see safety policy in code.</p>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : null}
      <div className="mt-3 space-y-2">
        {MODES.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2 text-left ${
              mode === m.id ? "border-premium-gold/50 bg-premium-gold/10" : "border-white/10 bg-black/20"
            }`}
          >
            <input
              type="radio"
              name="autonomy"
              className="mt-1"
              checked={mode === m.id}
              disabled={saving || (allowed.length > 0 && !allowed.includes(m.id))}
              onChange={() => void save(m.id)}
            />
            <div>
              <div className="text-sm font-medium text-white">{m.label}</div>
              <div className="text-xs text-slate-500">{m.desc}</div>
            </div>
          </label>
        ))}
      </div>
      {saving ? <p className="mt-2 text-xs text-slate-500">Saving…</p> : null}
      {msg ? <p className="mt-2 text-xs text-emerald-400/90">{msg}</p> : null}
    </section>
  );
}
