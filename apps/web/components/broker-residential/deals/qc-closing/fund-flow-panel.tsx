"use client";

import { useState } from "react";
import { FUND_MILESTONE_KINDS, FUND_MILESTONE_LABELS } from "@/modules/quebec-closing/quebec-closing-fund-flow";
import type { QcClosingApiBundle } from "./qc-closing-types";

const STATUSES = ["PENDING", "IN_FLIGHT", "COMPLETED", "NOT_APPLICABLE"] as const;

export function FundFlowPanel({
  dealId,
  bundle,
  onUpdated,
}: {
  dealId: string;
  bundle: QcClosingApiBundle;
  onUpdated: (b: QcClosingApiBundle) => void;
}) {
  const [kind, setKind] = useState<(typeof FUND_MILESTONE_KINDS)[number]>("DEPOSIT");
  const [status, setStatus] = useState<string>("PENDING");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      const amountCents =
        amount.trim() ? Math.round(Number.parseFloat(amount.replace(",", ".")) * 100) : null;
      if (amount.trim() && !Number.isFinite(amountCents)) {
        throw new Error("Invalid amount");
      }
      const res = await fetch(`/api/deals/${dealId}/closing/fund-milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, status, amountCents, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated(data as QcClosingApiBundle);
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
        {bundle.fundFlow.milestones.map((m) => (
          <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5">
            <span>
              <span className="text-ds-text-secondary">{m.label}</span> · {m.status}
            </span>
            {m.amountCents != null ? (
              <span className="font-mono">
                {(m.amountCents / 100).toLocaleString("en-CA", { style: "currency", currency: m.currency || "CAD" })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {bundle.fundFlow.paymentRows.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase text-ds-text-secondary">Trust / ledger payments</p>
          <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-[11px] text-ds-text-secondary">
            {bundle.fundFlow.paymentRows.map((p) => (
              <li key={p.id}>
                {p.paymentKind} · {p.status} ·{" "}
                {(p.amountCents / 100).toLocaleString("en-CA", { style: "currency", currency: p.currency })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-ds-text-secondary">
          Milestone
          <select
            className="mt-1 w-full rounded border border-ds-border bg-black/40 px-2 py-1.5 text-ds-text"
            value={kind}
            onChange={(e) => setKind(e.target.value as (typeof FUND_MILESTONE_KINDS)[number])}
          >
            {FUND_MILESTONE_KINDS.map((k) => (
              <option key={k} value={k}>
                {FUND_MILESTONE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ds-text-secondary">
          Status
          <select
            className="mt-1 w-full rounded border border-ds-border bg-black/40 px-2 py-1.5 text-ds-text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ds-text-secondary sm:col-span-2">
          Amount (CAD, optional)
          <input
            className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
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
        onClick={() => void save()}
      >
        Update fund milestone
      </button>
    </div>
  );
}
