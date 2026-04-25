"use client";

import { useState } from "react";
import type { DealClosingAdjustmentKind } from "@/modules/quebec-closing/quebec-closing.types";
import type { QcClosingApiBundle } from "./qc-closing-types";

const KINDS: { value: DealClosingAdjustmentKind; label: string }[] = [
  { value: "MUNICIPAL_TAX", label: "Municipal taxes" },
  { value: "SCHOOL_TAX", label: "School taxes" },
  { value: "CONDO_COMMON", label: "Condo / common charges" },
  { value: "RENT_DEPOSIT", label: "Rents & deposits" },
  { value: "PREPAID", label: "Prepaid items" },
  { value: "OCCUPANCY", label: "Occupancy adjustment" },
  { value: "OTHER", label: "Other" },
];

export function AdjustmentsPanel({
  dealId,
  bundle,
  onUpdated,
}: {
  dealId: string;
  bundle: QcClosingApiBundle;
  onUpdated: (b: QcClosingApiBundle) => void;
}) {
  const [kind, setKind] = useState<DealClosingAdjustmentKind>("MUNICIPAL_TAX");
  const [label, setLabel] = useState("");
  const [dollars, setDollars] = useState("");
  const [buyerOwes, setBuyerOwes] = useState(false);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addLine() {
    setErr(null);
    const amt = Number.parseFloat(dollars.replace(",", "."));
    if (!label.trim() || !Number.isFinite(amt)) {
      setErr("Label and amount (CAD) required");
      return;
    }
    const amountCents = Math.round(amt * 100);
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/closing/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label: label.trim(), amountCents, buyerOwes, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated(data as QcClosingApiBundle);
      setLabel("");
      setDollars("");
      setNotes("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <ul className="space-y-1 text-xs">
        {bundle.adjustments.length === 0 ? <li className="text-ds-text-secondary">No adjustment lines yet.</li> : null}
        {bundle.adjustments.map((a) => (
          <li key={a.id} className="flex flex-wrap justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5">
            <span>
              <span className="text-ds-text-secondary">{a.kind}</span> · {a.label}
              {a.buyerOwes ? <span className="ml-1 text-amber-400">(buyer owes)</span> : null}
            </span>
            <span className="font-mono">
              {(a.amountCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-ds-text-secondary">
          Kind
          <select
            className="mt-1 w-full rounded border border-ds-border bg-black/40 px-2 py-1.5 text-ds-text"
            value={kind}
            onChange={(e) => setKind(e.target.value as DealClosingAdjustmentKind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ds-text-secondary">
          Amount (CAD)
          <input
            className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text"
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="text-xs text-ds-text-secondary sm:col-span-2">
          Label
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-xs text-ds-text-secondary sm:col-span-2">
          <input type="checkbox" checked={buyerOwes} onChange={(e) => setBuyerOwes(e.target.checked)} />
          Buyer owes (debit to buyer)
        </label>
        <label className="text-xs text-ds-text-secondary sm:col-span-2">
          Notes
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <button
        type="button"
        disabled={loading || !bundle.closing}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ds-text disabled:opacity-40"
        onClick={() => void addLine()}
      >
        Add adjustment line
      </button>
    </div>
  );
}
