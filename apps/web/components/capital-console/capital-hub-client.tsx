"use client";

import * as React from "react";
import Link from "next/link";

type Summary = {
  dealsTracked: number;
  needingLenderAction: number;
  offerActivity: number;
  blockedBeforeClosing: number;
  covenantRiskSignals: number;
  deals: Array<{
    id: string;
    title: string;
    pipelineStage: string;
    pipelineLenders: Array<{ status: string }>;
    financingOffers: Array<{ status: string }>;
    financingConditions: Array<{ priority: string | null; status: string }>;
    financingCovenants: Array<{ status: string }>;
  }>;
};

export function CapitalHubClient({ localeCountryPrefix }: { localeCountryPrefix: string }) {
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/capital/pipeline/summary", { credentials: "include" });
        const data = (await res.json()) as Summary & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-600">{err}</p>;
  }
  if (!summary) {
    return <p className="text-sm text-muted-foreground">Loading financing pipeline…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Deals tracked" value={summary.dealsTracked} />
        <MetricCard label="Lender attention" value={summary.needingLenderAction} />
        <MetricCard label="Offer activity" value={summary.offerActivity} />
        <MetricCard label="Blocked (critical FC)" value={summary.blockedBeforeClosing} />
      </div>
      <p className="text-sm text-muted-foreground">
        Covenant risk signals (breach / risk flags):{" "}
        <span className="font-medium text-foreground">{summary.covenantRiskSignals}</span>
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pipeline deals</h2>
        <ul className="divide-y rounded-lg border border-border">
          {summary.deals.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link
                  href={`${localeCountryPrefix}/dashboard/capital/deals/${d.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {d.title}
                </Link>
                <p className="text-xs text-muted-foreground">{d.pipelineStage}</p>
              </div>
              <span className="text-xs text-muted-foreground">{d.id.slice(0, 8)}…</span>
            </li>
          ))}
          {summary.deals.length === 0 ?
            <li className="px-4 py-6 text-sm text-muted-foreground">No pipeline deals visible.</li>
          : null}
        </ul>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="text-primary underline-offset-4 hover:underline" href={`${localeCountryPrefix}/dashboard/capital/lenders`}>
          Lender relationships
        </Link>
        <Link className="text-primary underline-offset-4 hover:underline" href={`${localeCountryPrefix}/dashboard/capital/offers`}>
          Offers comparison
        </Link>
        <Link className="text-primary underline-offset-4 hover:underline" href={`${localeCountryPrefix}/dashboard/capital/closing`}>
          Closing readiness queue
        </Link>
      </nav>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
