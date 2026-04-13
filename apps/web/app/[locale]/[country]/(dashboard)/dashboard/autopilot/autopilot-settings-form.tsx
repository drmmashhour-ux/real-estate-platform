"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "off" | "assist" | "safe_autopilot" | "approval_required";

type Row = {
  mode: Mode;
  autoFixTitles: boolean;
  autoFixDescriptions: boolean;
  autoReorderPhotos: boolean;
  autoGenerateContent: boolean;
  allowPriceSuggestions: boolean;
};

export function AutopilotSettingsForm({ initial }: { initial: Row }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [autoFixTitles, setAutoFixTitles] = useState(initial.autoFixTitles);
  const [autoFixDescriptions, setAutoFixDescriptions] = useState(initial.autoFixDescriptions);
  const [autoReorderPhotos, setAutoReorderPhotos] = useState(initial.autoReorderPhotos);
  const [autoGenerateContent, setAutoGenerateContent] = useState(initial.autoGenerateContent);
  const [allowPriceSuggestions, setAllowPriceSuggestions] = useState(initial.allowPriceSuggestions);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/autopilot/settings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          autoFixTitles,
          autoFixDescriptions,
          autoReorderPhotos,
          autoGenerateContent,
          allowPriceSuggestions,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Saved.");
      router.refresh();
    } catch {
      setMsg("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Autopilot mode</h2>
      <p className="mt-1 text-sm text-slate-600">
        Safe autopilot only applies low-risk copy and photo order. Pricing stays approval-only.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-800">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            <option value="off">Off — no runs</option>
            <option value="assist">Assist — suggestions only</option>
            <option value="safe_autopilot">Safe autopilot — auto-apply low-risk</option>
            <option value="approval_required">Approval required — queue everything</option>
          </select>
        </label>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["Auto-fix titles", autoFixTitles, setAutoFixTitles],
            ["Auto-fix descriptions", autoFixDescriptions, setAutoFixDescriptions],
            ["Auto-reorder photos", autoReorderPhotos, setAutoReorderPhotos],
            ["Auto-generate subtitle/hook", autoGenerateContent, setAutoGenerateContent],
            ["Allow price suggestions (never auto-applied)", allowPriceSuggestions, setAllowPriceSuggestions],
          ].map(([label, val, set]) => (
            <label key={String(label)} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={val as boolean}
                onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
              />
              <span>{label as string}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
      {msg ? <p className="mt-2 text-sm text-slate-600">{msg}</p> : null}
    </div>
  );
}
