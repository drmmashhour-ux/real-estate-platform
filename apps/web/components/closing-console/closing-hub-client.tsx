"use client";

import * as React from "react";
import Link from "next/link";

type Summary = {
  totalClosingDeals: number;
  readyToClose: number;
  blockedClosings: number;
  missingDocumentsCount: number;
  pendingSignaturesCount: number;
  checklistCompletionRate: number;
  dealsAtRisk: Array<{ dealId: string; title: string; reason: string }>;
};

export function ClosingHubClient({ localeCountryPrefix }: { localeCountryPrefix: string }) {
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/closing/pipeline/summary", { credentials: "include" });
        const data = (await res.json()) as Summary & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed");
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!summary) return <p className="text-sm text-muted-foreground">Loading closing pipeline…</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active closing deals" value={summary.totalClosingDeals} />
        <Metric label="Ready to confirm" value={summary.readyToClose} />
        <Metric label="Blocked closings" value={summary.blockedClosings} />
        <Metric label="Checklist completion %" value={summary.checklistCompletionRate} />
      </div>
      <p className="text-sm text-muted-foreground">
        Documents missing (required):{" "}
        <span className="font-medium text-foreground">{summary.missingDocumentsCount}</span> · Pending signatures:{" "}
        <span className="font-medium text-foreground">{summary.pendingSignaturesCount}</span>
      </p>

      {summary.dealsAtRisk.length > 0 ?
        <section>
          <h2 className="mb-2 text-lg font-semibold">Deals at risk</h2>
          <ul className="divide-y rounded-lg border border-border">
            {summary.dealsAtRisk.map((d) => (
              <li key={d.dealId} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`${localeCountryPrefix}/dashboard/closing/${d.dealId}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {d.title}
                </Link>
                <span className="text-xs text-muted-foreground">{d.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      : null}

      <nav className="flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">Open a deal from your workspace to enter the closing room.</span>
      </nav>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
