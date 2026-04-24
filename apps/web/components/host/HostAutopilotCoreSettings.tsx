"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type HostAutopilotCoreSettingsState = {
  autopilotEnabled: boolean;
  autopilotMode: string;
  preferences: {
    autoPricing: boolean;
    autoMessaging: boolean;
    autoPromotions: boolean;
    autoListingOptimization: boolean;
  };
};

const MODES = [
  { id: "OFF", label: "Off", hint: "No autopilot runs." },
  { id: "ASSIST", label: "Assist", hint: "Suggestions & notifications only." },
  {
    id: "SAFE_AUTOPILOT",
    label: "Safe autopilot",
    hint: "May auto-apply listing copy when enabled below — never payouts/refunds.",
  },
  { id: "FULL_AUTOPILOT_APPROVAL", label: "Full (approvals)", hint: "Side effects require your approval first." },
] as const;

export function HostAutopilotCoreSettings({
  initialSettings,
  heading = "Autopilot control",
  intro,
}: {
  initialSettings: HostAutopilotCoreSettingsState;
  heading?: string;
  intro?: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const patch = (body: Record<string, unknown>) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/ai/host-autopilot/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Save failed");
        return;
      }
      setSettings((data as { settings: HostAutopilotCoreSettingsState }).settings);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8 text-slate-200">
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {intro}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">{heading}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manual override: turn everything off instantly. Financial actions (refunds, payouts, legal) never auto-run
          from Autopilot.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-600 bg-slate-900"
            checked={settings.autopilotEnabled}
            disabled={pending}
            onChange={(e) => patch({ autopilotEnabled: e.target.checked })}
          />
          <span>Enable host AI Autopilot</span>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Mode</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
                settings.autopilotMode === m.id ? "border-amber-500/60 bg-amber-950/20" : "border-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="autopilotMode"
                  value={m.id}
                  checked={settings.autopilotMode === m.id}
                  disabled={pending || !settings.autopilotEnabled}
                  onChange={() => patch({ autopilotMode: m.id })}
                />
                <span className="font-medium text-white">{m.label}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{m.hint}</p>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Capabilities</h2>
        <p className="mt-1 text-sm text-slate-500">
          Toggle what the engine may work on. Pricing is suggest-only or approval — never silent large price changes.
        </p>
        <ul className="mt-4 space-y-3">
          {(
            [
              ["autoListingOptimization", "Listing optimization (title & description)"],
              ["autoPricing", "Pricing insights"],
              ["autoMessaging", "Guest message drafts"],
              ["autoPromotions", "Promotion ideas"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/80 px-3 py-2">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                checked={settings.preferences[key]}
                disabled={pending || !settings.autopilotEnabled}
                onChange={(e) => patch({ [key]: e.target.checked })}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
