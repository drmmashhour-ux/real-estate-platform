"use client";

import { useCallback, useEffect, useState } from "react";
import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";

type Settings = {
  revenueMonetizationEnabled: boolean;
  revenueLeadUnlockMinCents: number | null;
  revenueLeadUnlockMaxCents: number | null;
  revenueLeadDefaultPriceCents: number | null;
  revenueListingBoostPriceCents: number | null;
  revenueListingBoostDurationDays: number | null;
  bnhubHostFeePercentOverride: string | null;
};

export function RevenueControlPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/revenue-control", { credentials: "same-origin" });
      if (!res.ok) throw new Error("load failed");
      setS(await res.json());
    } catch {
      setMessage("Could not load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/revenue-control", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revenueMonetizationEnabled: s.revenueMonetizationEnabled,
          revenueLeadUnlockMinCents: s.revenueLeadUnlockMinCents,
          revenueLeadUnlockMaxCents: s.revenueLeadUnlockMaxCents,
          revenueLeadDefaultPriceCents: s.revenueLeadDefaultPriceCents,
          revenueListingBoostPriceCents: s.revenueListingBoostPriceCents,
          revenueListingBoostDurationDays: s.revenueListingBoostDurationDays,
          bnhubHostFeePercentOverride:
            s.bnhubHostFeePercentOverride === "" || s.bnhubHostFeePercentOverride == null
              ? null
              : Number(s.bnhubHostFeePercentOverride),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setMessage("Saved.");
      await load();
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !s) {
    return <p className="text-sm text-zinc-500">Loading revenue controls…</p>;
  }

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-800 bg-[#111] p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Revenue & monetization</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Lead unlock uses <code className="text-xs text-zinc-400">PRICING_CONFIG</code> bands (low / medium / high) plus
          optional overrides below. BNHub booking reference commission:{" "}
          {(PRICING_CONFIG.canada.bookingCommission * 100).toFixed(0)}% — host fee field overrides checkout when set.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={s.revenueMonetizationEnabled}
          onChange={(e) => setS({ ...s, revenueMonetizationEnabled: e.target.checked })}
          className="rounded border-zinc-600"
        />
        Paid lead unlock &amp; monetization (when off, unlock flows stay relaxed — product rules apply)
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-400">Lead unlock min (cents)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            value={s.revenueLeadUnlockMinCents ?? ""}
            onChange={(e) =>
              setS({
                ...s,
                revenueLeadUnlockMinCents: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Lead unlock max (cents)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            value={s.revenueLeadUnlockMaxCents ?? ""}
            onChange={(e) =>
              setS({
                ...s,
                revenueLeadUnlockMaxCents: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-zinc-400">
            Default lead price anchor (cents CAD, e.g. 4900 = $49) — optional; empty uses config default (
            {PRICING_CONFIG.canada.lead.default} CAD)
          </span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            placeholder={`${PRICING_CONFIG.canada.lead.default * 100}`}
            value={s.revenueLeadDefaultPriceCents ?? ""}
            onChange={(e) =>
              setS({
                ...s,
                revenueLeadDefaultPriceCents: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Listing boost price (cents)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            value={s.revenueListingBoostPriceCents ?? ""}
            onChange={(e) =>
              setS({
                ...s,
                revenueListingBoostPriceCents: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Boost duration (days)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            value={s.revenueListingBoostDurationDays ?? ""}
            onChange={(e) =>
              setS({
                ...s,
                revenueListingBoostDurationDays: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-zinc-400">
            Booking / host fee override (% — leave empty for code default; aligns with platform commission policy, ref.{" "}
            {(PRICING_CONFIG.canada.bookingCommission * 100).toFixed(0)}% in config)
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            placeholder="e.g. 3"
            value={s.bnhubHostFeePercentOverride ?? ""}
            onChange={(e) => setS({ ...s, bnhubHostFeePercentOverride: e.target.value })}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message ? <span className="text-sm text-zinc-400">{message}</span> : null}
      </div>

      <p className="text-xs text-zinc-600">
        Grant AI insights premium: set <code className="text-zinc-500">User.lecipmAiInsightsPremiumUntil</code> in
        DB or via internal ops — checkout SKU for insights can be added later.
      </p>
    </div>
  );
}
