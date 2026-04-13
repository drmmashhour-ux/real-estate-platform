"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  activeMarketCode: string;
  syriaModeEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  manualPaymentTrackingEnabled: boolean;
  contactFirstEmphasis: boolean;
  defaultDisplayCurrency: string;
};

export function MarketSettingsClient() {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/market-settings", { credentials: "same-origin" });
      const data = (await res.json()) as Row;
      if (res.ok) setRow(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<Row>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/market-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      setRow(data as Row);
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !row) {
    return <p className="text-sm text-slate-400">Loading market settings…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-slate-100">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Launch profile</h2>
        <p className="mt-2 text-sm text-slate-400">
          Syria mode applies the offline-first booking profile. You can still override payments and contact UX below.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={row.syriaModeEnabled}
            disabled={saving}
            onChange={(e) => void save({ syriaModeEnabled: e.target.checked })}
          />
          <span>Syria launch mode (manual-first booking profile)</span>
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Active market code</span>
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
            value={row.activeMarketCode}
            disabled={saving}
            onChange={(e) => void save({ activeMarketCode: e.target.value })}
          >
            <option value="default">default</option>
            <option value="syria">syria</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Payments &amp; booking</h2>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={row.onlinePaymentsEnabled}
            disabled={saving}
            onChange={(e) => void save({ onlinePaymentsEnabled: e.target.checked })}
          />
          <span>Online payments enabled (Stripe checkout)</span>
        </label>
        <label className="mt-3 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={row.manualPaymentTrackingEnabled}
            disabled={saving}
            onChange={(e) => void save({ manualPaymentTrackingEnabled: e.target.checked })}
          />
          <span>Manual payment tracking (host marks received / failed)</span>
        </label>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Contact-first UX</h2>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={row.contactFirstEmphasis}
            disabled={saving}
            onChange={(e) => void save({ contactFirstEmphasis: e.target.checked })}
          />
          <span>Emphasize contact host / questions before booking</span>
        </label>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Default display currency (ISO 4217)</span>
          <input
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
            value={row.defaultDisplayCurrency}
            disabled={saving}
            onChange={(e) => setRow({ ...row, defaultDisplayCurrency: e.target.value.toUpperCase() })}
            onBlur={() => void save({ defaultDisplayCurrency: row.defaultDisplayCurrency })}
          />
        </label>
      </div>

      {message ? <p className="text-sm text-amber-300">{message}</p> : null}
    </div>
  );
}
