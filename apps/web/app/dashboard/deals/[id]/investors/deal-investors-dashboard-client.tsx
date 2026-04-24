"use client";

import * as React from "react";
import Link from "next/link";

type Row = {
  commitmentId: string;
  investorId: string;
  committedAmountCents: number;
  currency: string;
  status: string;
  spvId: string | null;
  lifecycle: string;
  subscription: {
    id: string;
    signed: boolean;
    signedAt: string | null;
    payments: { id: string; amountCents: number; received: boolean; method: string }[];
  } | null;
};

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export function DealInvestorsDashboardClient({ dealId }: { dealId: string }) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/deals/${dealId}/investors`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Failed to load");
      return;
    }
    setRows((j.investors as Row[]) ?? []);
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Investors</h1>
          <p className="text-muted-foreground font-mono text-xs">{dealId}</p>
        </div>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs"
          onClick={() => void load()}
        >
          Refresh
        </button>
      </div>
      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 font-medium">Investor</th>
              <th className="p-2 font-medium">Commitment</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Lifecycle</th>
              <th className="p-2 font-medium">Signed</th>
              <th className="p-2 font-medium">Payments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.commitmentId} className="border-t">
                <td className="p-2 font-mono">{r.investorId.slice(0, 8)}…</td>
                <td className="p-2">
                  {money(r.committedAmountCents)} {r.currency}
                </td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.lifecycle}</td>
                <td className="p-2">{r.subscription?.signed ? "Yes" : "No"}</td>
                <td className="p-2">
                  {r.subscription?.payments.length ?
                    r.subscription.payments
                      .map((p) => `${money(p.amountCents)} ${p.received ? "✓" : "—"}`)
                      .join(", ")
                  : "—"}
                </td>
                <td className="p-2">
                  <Link
                    href={`/dashboard/deals/${dealId}/investor-packet/${r.investorId}`}
                    className="text-blue-600 underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ?
          <p className="text-muted-foreground p-4">No investor commitments yet.</p>
        : null}
      </div>
    </div>
  );
}
