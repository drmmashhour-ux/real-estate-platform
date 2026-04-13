"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#D4AF37";

const MODES = [
  "OFF",
  "ASSIST_ONLY",
  "RECOMMENDATIONS_ONLY",
  "SEMI_AUTONOMOUS",
  "AUTONOMOUS_SAFE",
  "AUTONOMOUS_MAX_WITH_OVERRIDE",
  "ASSISTANT",
  "RECOMMENDATIONS",
  "SAFE_AUTOPILOT",
  "APPROVAL_AUTOPILOT",
] as const;

export function AiSettingsClient({
  initial,
}: {
  initial: {
    globalMode: string;
    automationsEnabled: boolean;
    notifyOnApproval: boolean;
    globalKillSwitch: boolean;
  };
}) {
  const router = useRouter();
  const [globalMode, setGlobalMode] = useState(initial.globalMode);
  const [automationsEnabled, setAutomationsEnabled] = useState(initial.automationsEnabled);
  const [notifyOnApproval, setNotifyOnApproval] = useState(initial.notifyOnApproval);
  const [globalKillSwitch, setGlobalKillSwitch] = useState(initial.globalKillSwitch);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/ai/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalMode, automationsEnabled, notifyOnApproval, globalKillSwitch }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-6 rounded-xl border border-white/10 bg-[#141414] p-5">
      <label className="block text-sm text-white/70">
        Global mode
        <select
          value={globalMode}
          onChange={(e) => setGlobalMode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={automationsEnabled} onChange={(e) => setAutomationsEnabled(e.target.checked)} />
        Automations enabled
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={notifyOnApproval} onChange={(e) => setNotifyOnApproval(e.target.checked)} />
        Notify on new approval requests
      </label>
      <label className="flex items-center gap-2 text-sm text-amber-200/90">
        <input type="checkbox" checked={globalKillSwitch} onChange={(e) => setGlobalKillSwitch(e.target.checked)} />
        Global kill switch (stops scheduled automations)
      </label>
      <button
        type="button"
        disabled={saving}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
        style={{ backgroundColor: GOLD }}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
