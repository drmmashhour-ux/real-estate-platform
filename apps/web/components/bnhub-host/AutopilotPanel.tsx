"use client";

const MODES = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"] as const;

export function AutopilotPanel({
  settings,
}: {
  settings: {
    mode: string;
    autoMessaging: boolean;
    autoPricing: boolean;
    paused: boolean;
  } | null;
}) {
  if (!settings) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-3 text-sm text-neutral-500">
        No autopilot settings on file — defaults apply (ASSIST / review-first).
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-premium-gold/30 bg-premium-gold/5 p-3">
      <p className="text-sm font-medium text-white">Autopilot</p>
      <p className="mt-1 text-xs text-neutral-400">
        Mode: <span className="text-premium-gold">{settings.mode}</span>
        {MODES.includes(settings.mode as (typeof MODES)[number]) ? "" : " (custom)"}
      </p>
      <ul className="mt-2 list-inside list-disc text-xs text-neutral-500">
        <li>Pricing automation toggles: {settings.autoPricing ? "on" : "off"} (still requires approval if configured)</li>
        <li>Messaging automation: {settings.autoMessaging ? "on" : "off"} — drafts only unless SAFE+ enabled</li>
        <li>Paused: {settings.paused ? "yes" : "no"}</li>
      </ul>
    </div>
  );
}
