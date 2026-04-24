"use client";

import { useCallback, useEffect, useState } from "react";

const MODES = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"] as const;

type Mode = (typeof MODES)[number];

export function AutopilotModeSelector({ onChange }: { onChange?: (mode: string) => void }) {
  const [mode, setMode] = useState<Mode>("ASSIST");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-autopilot/config");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "load failed");
      const m = (data.config?.mode as string)?.toUpperCase();
      if (MODES.includes(m as Mode)) setMode(m as Mode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next: Mode) => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-autopilot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "save failed");
      setMode(next);
      onChange?.(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-[#D4AF37]/70">Chargement du mode autopilot…</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]/90">Mode autopilot</p>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            disabled={saving}
            onClick={() => save(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === m
                ? "bg-[#D4AF37]/20 text-[#D4AF37] ring-1 ring-[#D4AF37]/60"
                : "bg-black/60 text-zinc-400 ring-1 ring-white/10 hover:text-white"
            }`}
          >
            {m.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <p className="text-[10px] leading-snug text-zinc-500">
        Aucun engagement juridique automatique — approbation humaine requise pour les actes sensibles.
      </p>
    </div>
  );
}
