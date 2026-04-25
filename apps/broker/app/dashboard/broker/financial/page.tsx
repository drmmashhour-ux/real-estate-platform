"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type OverviewResponse = {
  success?: boolean;
  periodKey?: string;
  sums?: {
    trust_cents: number;
    operating_cents: number;
    platform_cents: number;
    pending_review_cents: number;
    pending_review_count: number;
  };
  registers?: { id: string; registerType: string; periodKey: string }[];
  receiptCount?: number;
  error?: string;
};

function formatCad(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FinancialDashboardPage() {
  const [periodKey, setPeriodKey] = useState(() => new Date().toISOString().slice(0, 7));
  const [agencyId, setAgencyId] = useState("");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams({ periodKey });
    if (agencyId.trim()) p.set("agencyId", agencyId.trim());
    return p.toString();
  }, [periodKey, agencyId]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/financial/overview?${qs}`, { credentials: "same-origin" });
      const json = (await res.json()) as OverviewResponse;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to load");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
      setData(null);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  const sums = data?.sums;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]">Financial Records & Registers</h1>
        <p className="text-sm text-gray-400 mt-2">
          Receipt-of-cash forms, ledger lines, and period registers — trust, operating, and platform revenue kept
          separate. Corrections use reversals, not deletion.
        </p>
        {error ? <p className="mt-2 text-sm text-amber-400">{error}</p> : null}
      </div>

      <div className="flex flex-wrap gap-4 items-end max-w-3xl">
        <label className="grid gap-1 text-xs text-gray-500">
          Period (YYYY-MM)
          <input
            className="bg-black text-white border border-gray-700 p-2 font-mono"
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-gray-500 flex-1 min-w-[200px]">
          Agency id (optional — agency mode)
          <input
            className="bg-black text-white border border-gray-700 p-2 font-mono text-sm"
            placeholder="Leave blank for solo broker"
            value={agencyId}
            onChange={(e) => setAgencyId(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-[#D4AF37] underline px-2 py-2"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Trust receipts (period)</div>
          <div className="text-2xl font-bold mt-2">{sums ? formatCad(sums.trust_cents) : "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Operating receipts (period)</div>
          <div className="text-2xl font-bold mt-2">{sums ? formatCad(sums.operating_cents) : "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Platform fees (period)</div>
          <div className="text-2xl font-bold mt-2">{sums ? formatCad(sums.platform_cents) : "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Pending review</div>
          <div className="text-2xl font-bold mt-2">
            {sums ? `${sums.pending_review_count} · ${formatCad(sums.pending_review_cents)}` : "—"}
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/dashboard/broker/financial/receipts/create"
          className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded"
        >
          New receipt
        </Link>
        <Link
          href="/dashboard/broker/financial/commissions"
          className="px-4 py-2 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold rounded hover:bg-[#D4AF37]/10"
        >
          Commissions &amp; tax
        </Link>
      </div>

      <div className="rounded-xl border border-[#D4AF37]/20 bg-black p-5">
        <h2 className="text-lg font-semibold text-white">Registers</h2>
        <p className="text-xs text-gray-500 mt-1">
          Period {data?.periodKey ?? periodKey} · {data?.receiptCount ?? 0} receipt(s)
        </p>

        <div className="mt-4 space-y-3">
          {!data?.registers?.length ? (
            <p className="text-sm text-gray-500">No register buckets for this period yet — create a receipt to open one.</p>
          ) : (
            data.registers.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 p-4 text-white flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{r.registerType.replace(/_/g, " ")}</div>
                  <div className="text-sm text-gray-400 font-mono">{r.periodKey}</div>
                </div>
                <div className="text-sm uppercase text-[#D4AF37]">active</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
