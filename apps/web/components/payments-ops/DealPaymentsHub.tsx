"use client";

import { useCallback, useEffect, useState } from "react";
import { TrustWorkflowPanel } from "./TrustWorkflowPanel";

type Props = { dealId: string; includeLedger?: boolean };

export function DealPaymentsHub({ dealId, includeLedger = true }: Props) {
  const [trust, setTrust] = useState<{ workflow?: unknown; explainer?: { detail?: string } } | null>(null);
  const [payments, setPayments] = useState<unknown>(null);
  const [ledger, setLedger] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const t = await fetch(`/api/deals/${dealId}/trust-workflow`, { credentials: "include" });
      const p = await fetch(`/api/deals/${dealId}/payments`, { credentials: "include" });
      const tj = await t.json();
      const pj = await p.json();
      if (!t.ok) throw new Error(tj.error ?? "trust");
      if (!p.ok) throw new Error(pj.error ?? "payments");
      setTrust(tj);
      setPayments(pj);
      if (includeLedger) {
        const l = await fetch(`/api/deals/${dealId}/ledger`, { credentials: "include" });
        const lj = await l.json();
        if (!l.ok) throw new Error(lj.error ?? "ledger");
        setLedger(lj);
      } else {
        setLedger({ disabled: true, message: "Enable FEATURE_DEAL_LEDGER_V1 for full ledger API." });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [dealId, includeLedger]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-zinc-950/80 p-6">
      <h2 className="font-serif text-lg text-emerald-100">Payments &amp; trust workflow</h2>
      <TrustWorkflowPanel
        explainer={
          trust?.explainer?.detail ??
          "Tracks requests and confirmations — LECIPM is not your trust institution unless separately contracted."
        }
      />
      {err ? <p className="mt-2 text-sm text-amber-400">{err}</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Trust</h3>
          <pre className="mt-2 max-h-40 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
            {JSON.stringify(trust, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payments</h3>
          <pre className="mt-2 max-h-40 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
            {JSON.stringify(payments, null, 2)}
          </pre>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ledger</h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
            {JSON.stringify(ledger, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
