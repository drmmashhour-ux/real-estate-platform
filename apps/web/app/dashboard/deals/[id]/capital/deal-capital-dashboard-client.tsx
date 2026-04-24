"use client";

import * as React from "react";

type Summary = {
  investmentTargetCents: number | null;
  softCommitCents: number;
  confirmedCommitCents: number;
  committedCapitalCents: number;
  receivedCapitalCents: number;
  remainingGapCents: number | null;
};

function money(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export function DealCapitalDashboardClient({ dealId }: { dealId: string }) {
  const [data, setData] = React.useState<Summary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      const r = await fetch(`/api/deals/${dealId}/capital`, { credentials: "include" });
      const j = await r.json();
      if (cancelled) return;
      if (!r.ok) {
        setErr(j.error ?? "Failed to load capital summary");
        return;
      }
      setData({
        investmentTargetCents: j.investmentTargetCents,
        softCommitCents: j.softCommitCents,
        confirmedCommitCents: j.confirmedCommitCents,
        committedCapitalCents: j.committedCapitalCents,
        receivedCapitalCents: j.receivedCapitalCents,
        remainingGapCents: j.remainingGapCents,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Capital summary</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">{dealId}</p>
      </div>
      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}
      {data ?
        <dl className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Total target</dt>
            <dd className="text-lg font-medium">{money(data.investmentTargetCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Committed (soft + confirmed)</dt>
            <dd className="text-lg font-medium">{money(data.committedCapitalCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Soft commit</dt>
            <dd>{money(data.softCommitCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Broker-confirmed</dt>
            <dd>{money(data.confirmedCommitCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Received capital</dt>
            <dd className="text-lg font-medium text-emerald-800">{money(data.receivedCapitalCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Remaining gap</dt>
            <dd className="text-lg font-medium">{money(data.remainingGapCents)}</dd>
          </div>
        </dl>
      : !err ?
        <p className="text-muted-foreground">Loading…</p>
      : null}
      <p className="text-muted-foreground text-xs">
        Target uses <code className="rounded bg-muted px-1">executionMetadata.investmentTargetCents</code> when set.
        Subscriptions and payments require broker attestation per AMF-style workflow.
      </p>
    </div>
  );
}
