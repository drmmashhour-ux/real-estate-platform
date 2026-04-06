"use client";

import { useState } from "react";
import { AUTOPILOT_MODES, type AutopilotMode } from "@/lib/ai/types";

export type AutonomyControlsInitial = {
  globalMode: AutopilotMode;
  automationsEnabled: boolean;
  notifyOnApproval: boolean;
  globalKillSwitch: boolean;
  autonomyPausedUntil: string | null;
};

export function AutonomyControlsClient({ initial }: { initial: AutonomyControlsInitial }) {
  const [globalMode, setGlobalMode] = useState(initial.globalMode);
  const [automationsEnabled, setAutomationsEnabled] = useState(initial.automationsEnabled);
  const [notifyOnApproval, setNotifyOnApproval] = useState(initial.notifyOnApproval);
  const [globalKillSwitch, setGlobalKillSwitch] = useState(initial.globalKillSwitch);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      const s = (await res.json()) as AutonomyControlsInitial;
      setGlobalMode(s.globalMode);
      setAutomationsEnabled(s.automationsEnabled);
      setNotifyOnApproval(s.notifyOnApproval);
      setGlobalKillSwitch(s.globalKillSwitch);
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-200">Live platform controls</h2>
      <p className="mt-1 text-sm text-slate-500">
        Persists to Manager AI platform settings. Payments and disputes are still blocked by guardrails regardless of mode.
      </p>

      {initial.autonomyPausedUntil ? (
        <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200/90">
          Autonomy paused until {new Date(initial.autonomyPausedUntil).toISOString()}. Use{" "}
          <code className="text-amber-100">/api/ai/autonomy/resume</code> or intelligence tools to clear.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
      {savedAt ? (
        <p className="mt-2 text-xs text-slate-500">Last saved: {savedAt}</p>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-slate-300">Global autopilot mode</span>
          <select
            className="mt-2 w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={globalMode}
            disabled={saving}
            onChange={(e) => {
              const v = e.target.value as AutopilotMode;
              setGlobalMode(v);
              void patch({ globalMode: v });
            }}
          >
            {AUTOPILOT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={automationsEnabled}
              disabled={saving}
              onChange={(e) => {
                const v = e.target.checked;
                setAutomationsEnabled(v);
                void patch({ automationsEnabled: v });
              }}
            />
            Automations enabled (cron / bounded passes)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={globalKillSwitch}
              disabled={saving}
              onChange={(e) => {
                const v = e.target.checked;
                setGlobalKillSwitch(v);
                void patch({ globalKillSwitch: v });
              }}
            />
            Global kill switch (blocks all platform automation gates)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={notifyOnApproval}
              disabled={saving}
              onChange={(e) => {
                const v = e.target.checked;
                setNotifyOnApproval(v);
                void patch({ notifyOnApproval: v });
              }}
            />
            Notify on approval queue items
          </label>
        </div>

        {saving ? <p className="text-xs text-slate-500">Saving…</p> : null}
      </div>
    </section>
  );
}
