"use client";

export function PaymentLedgerPanel({ summary }: { summary?: string }) {
  return <p className="font-mono text-[10px] text-zinc-500">{summary ?? "Ledger entries are append-only audit events."}</p>;
}
