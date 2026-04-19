"use client";

import { useCallback, useState } from "react";
import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";
import type { LeadPricingOverride } from "@/modules/leads/lead-pricing-experiments.types";

const REASON_PRESETS = [
  "high-value relationship",
  "strategic test",
  "conservative hold",
  "demand signal underweighted",
  "admin review decision",
];

export function LeadPricingOverridePanel({
  leadId,
  monetization,
  leadPricing,
  activeOverride,
  onChanged,
}: {
  leadId: string;
  monetization: LeadMonetizationControlSummary;
  leadPricing?: { leadPrice: number };
  activeOverride?: LeadPricingOverride | null;
  onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [overridePriceInput, setOverridePriceInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const baseSnap = monetization.basePrice;
  const systemSnap = monetization.suggestedPrice;

  const applyOverride = useCallback(async () => {
    setBusy("apply");
    setError("");
    const price = Number(overridePriceInput.replace(/,/g, ""));
    const reason = reasonInput.trim();
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a positive override amount (CAD dollars).");
      setBusy(null);
      return;
    }
    if (!reason) {
      setError("Reason is required — describe why this internal advisory figure is set.");
      setBusy(null);
      return;
    }
    const res = await fetch(`/api/admin/leads/${leadId}/pricing-override`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overridePrice: Math.round(price),
        reason,
        basePriceSnapshot: Math.round(baseSnap),
        systemSuggestedSnapshot: Math.round(systemSnap),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not save override.");
      setBusy(null);
      return;
    }
    setOpen(false);
    setOverridePriceInput("");
    setReasonInput("");
    await onChanged();
    setBusy(null);
  }, [baseSnap, leadId, onChanged, overridePriceInput, reasonInput, systemSnap]);

  const clearOverride = useCallback(async () => {
    setBusy("clear");
    setError("");
    const res = await fetch(`/api/admin/leads/${leadId}/pricing-override`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not clear override.");
      setBusy(null);
      return;
    }
    await onChanged();
    setBusy(null);
  }, [leadId, onChanged]);

  const active = activeOverride?.status === "active" ? activeOverride : null;

  return (
    <section className="mt-6 rounded-2xl border border-amber-500/30 bg-[#1a1308] p-5 shadow-[0_0_0_1px_rgba(245,158,11,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">Operator</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lead pricing override</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            This override is internal and advisory. It does not automatically change public pricing or payment
            behavior.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">System suggestion</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-white">${systemSnap.toLocaleString()} CAD</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Monetization primary · base reference ${baseSnap.toLocaleString()}
            {leadPricing?.leadPrice != null ? ` · engine ${leadPricing.leadPrice}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Active override</p>
          {active ? (
            <>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-100">
                ${active.overridePrice.toLocaleString()} CAD
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{active.reason}</p>
              <p className="mt-2 text-[10px] text-slate-600">
                Operator {active.createdBy.slice(0, 8)}… · {new Date(active.createdAt).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No active override — precedence uses monetization/base.</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          onClick={() => setOpen(true)}
        >
          Apply override…
        </button>
        <button
          type="button"
          disabled={busy !== null || !active}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-40"
          onClick={() => void clearOverride()}
        >
          {busy === "clear" ? "Clearing…" : "Clear override"}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Apply internal advisory override</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Record an explicit dollar figure for operator review. This row is logged — it does not drive Stripe,
              checkout, or buyer-facing quotes.
            </p>
            <label className="mt-5 block text-xs font-medium text-slate-400">
              Override price (CAD dollars)
              <input
                type="text"
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                value={overridePriceInput}
                onChange={(e) => setOverridePriceInput(e.target.value)}
                placeholder={`e.g. ${Math.round(systemSnap)}`}
              />
            </label>
            <label className="mt-4 block text-xs font-medium text-slate-400">
              Reason (required)
              <textarea
                className="mt-1 min-h-[88px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Why this advisory figure…"
              />
            </label>
            <p className="mt-2 text-[11px] text-slate-500">
              Examples: {REASON_PRESETS.join(" · ")}.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
                onClick={() => void applyOverride()}
              >
                {busy === "apply" ? "Saving…" : "Save override"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
