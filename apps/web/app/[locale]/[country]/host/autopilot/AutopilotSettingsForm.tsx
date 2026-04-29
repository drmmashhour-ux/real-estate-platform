"use client";

import type { HostAutopilotSettingsView } from "@/types/host-autopilot-settings-client";
import { AutopilotMode } from "@/types/host-autopilot-settings-client";
import { useState } from "react";

const GOLD = "#D4AF37";

const MODES: { value: AutopilotMode; label: string; hint: string }[] = [
  { value: AutopilotMode.OFF, label: "Off", hint: "No AI suggestions or actions" },
  { value: AutopilotMode.ASSIST, label: "Assist", hint: "Suggestions only — nothing runs automatically" },
  { value: AutopilotMode.SAFE_AUTOPILOT, label: "Safe autopilot", hint: "Actions queued; approval required per your toggles" },
  {
    value: AutopilotMode.FULL_AUTOPILOT_APPROVAL,
    label: "Full (logged)",
    hint: "Executable actions with audit trail — still respects pause and caps",
  },
];

export function AutopilotSettingsForm({ initial }: { initial: HostAutopilotSettingsView }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    mode: initial.mode,
    autoPricing: initial.autoPricing,
    autoPromotions: initial.autoPromotions,
    autoListingOptimization: initial.autoListingOptimization,
    autoMessaging: initial.autoMessaging,
    minPrice: initial.minPrice != null ? String(initial.minPrice) : "",
    maxPrice: initial.maxPrice != null ? String(initial.maxPrice) : "",
    maxDailyChangePct: initial.maxDailyChangePct ?? 15,
    requireApprovalForPricing: initial.requireApprovalForPricing,
    requireApprovalForPromotions: initial.requireApprovalForPromotions,
    paused: initial.paused,
    pauseReason: initial.pauseReason ?? "",
  });

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/host/autopilot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          autoPricing: form.autoPricing,
          autoPromotions: form.autoPromotions,
          autoListingOptimization: form.autoListingOptimization,
          autoMessaging: form.autoMessaging,
          minPrice: form.minPrice === "" ? null : Number(form.minPrice),
          maxPrice: form.maxPrice === "" ? null : Number(form.maxPrice),
          maxDailyChangePct: form.maxDailyChangePct,
          requireApprovalForPricing: form.requireApprovalForPricing,
          requireApprovalForPromotions: form.requireApprovalForPromotions,
          paused: form.paused,
          pauseReason: form.pauseReason || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Settings saved.");
    } catch {
      setMsg("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">Mode</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
                form.mode === m.value ? "border-[#D4AF37]/50 bg-black/40" : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="mode"
                className="sr-only"
                checked={form.mode === m.value}
                onChange={() => setForm((f) => ({ ...f, mode: m.value }))}
              />
              <span className="font-medium text-white">{m.label}</span>
              <span className="mt-1 text-xs text-zinc-500">{m.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">Automation</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Auto pricing</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, autoPricing: !f.autoPricing }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                form.autoPricing ? "bg-emerald-900/50 text-emerald-200" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {form.autoPricing ? "On" : "Off"}
            </button>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Auto promotions</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, autoPromotions: !f.autoPromotions }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                form.autoPromotions ? "bg-emerald-900/50 text-emerald-200" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {form.autoPromotions ? "On" : "Off"}
            </button>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Listing optimization</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, autoListingOptimization: !f.autoListingOptimization }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                form.autoListingOptimization ? "bg-emerald-900/50 text-emerald-200" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {form.autoListingOptimization ? "On" : "Off"}
            </button>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Guest messaging (off by default)</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, autoMessaging: !f.autoMessaging }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                form.autoMessaging ? "bg-emerald-900/50 text-emerald-200" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {form.autoMessaging ? "On" : "Off"}
            </button>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">Constraints</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-400">Min price ($ / night)</span>
            <input
              type="number"
              value={form.minPrice}
              onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Max price ($ / night)</span>
            <input
              type="number"
              value={form.maxPrice}
              onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Max daily change (%)</span>
            <input
              type="number"
              value={form.maxDailyChangePct}
              onChange={(e) => setForm((f) => ({ ...f, maxDailyChangePct: Number(e.target.value) || 15 }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Approval required for pricing</span>
            <input
              type="checkbox"
              checked={form.requireApprovalForPricing}
              onChange={(e) => setForm((f) => ({ ...f, requireApprovalForPricing: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Approval required for promotions</span>
            <input
              type="checkbox"
              checked={form.requireApprovalForPromotions}
              onChange={(e) => setForm((f) => ({ ...f, requireApprovalForPromotions: e.target.checked }))}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6">
        <h2 className="text-lg font-semibold text-amber-100">Emergency</h2>
        <label className="mt-3 flex items-center justify-between gap-4 text-sm">
          <span className="text-amber-200/90">Pause autopilot</span>
          <input
            type="checkbox"
            checked={form.paused}
            onChange={(e) => setForm((f) => ({ ...f, paused: e.target.checked }))}
          />
        </label>
        <textarea
          value={form.pauseReason}
          onChange={(e) => setForm((f) => ({ ...f, pauseReason: e.target.value }))}
          placeholder="Pause reason (optional)"
          className="mt-3 w-full rounded-xl border border-amber-900/50 bg-black/50 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-900/80"
          rows={2}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
          style={{ backgroundColor: GOLD }}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg ? <span className="text-sm text-zinc-400">{msg}</span> : null}
      </div>
    </div>
  );
}
