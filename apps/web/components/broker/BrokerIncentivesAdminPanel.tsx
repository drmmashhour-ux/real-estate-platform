"use client";

import * as React from "react";
import type { BrokerIncentivesAdminOverview } from "@/modules/broker/incentives/broker-incentives-admin.service";

export function BrokerIncentivesAdminPanel() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BrokerIncentivesAdminOverview | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/broker-incentives-overview", { credentials: "same-origin" });
        const json = (await res.json()) as BrokerIncentivesAdminOverview & { error?: string };
        if (res.status === 404) {
          if (!cancelled) setErr("Incentives flag is off.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setErr(json.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setData(json as BrokerIncentivesAdminOverview);
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading incentives observability…</p>;
  }
  if (err || !data) {
    return <p className="text-sm text-slate-400">{err ?? "No data"}</p>;
  }

  return (
    <div className="space-y-6 text-white">
      <p className="text-xs text-slate-500">{data.note} Scanned {data.scanned} brokers.</p>

      <section>
        <h3 className="text-sm font-semibold text-slate-200">Strong activity streaks (≥4 days)</h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {data.strongActivityStreaks.length === 0 ? (
            <li>None in this cohort.</li>
          ) : (
            data.strongActivityStreaks.map((r) => (
              <li key={r.brokerId}>
                {r.displayName} — streak {r.activityStreakCurrent} · milestones {r.milestonesAchieved}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200">Quiet workspaces (≥7 days since last touch)</h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {data.inactiveBrokers.length === 0 ? (
            <li>None flagged in this cohort.</li>
          ) : (
            data.inactiveBrokers.map((r) => (
              <li key={r.brokerId}>
                {r.displayName} — ~{r.inactiveDaysApprox} days since last logged touch
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200">Recent wins logged (14d)</h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {data.recentWinBrokers.length === 0 ? (
            <li>No wins logged in window for scanned brokers.</li>
          ) : (
            data.recentWinBrokers.map((r) => (
              <li key={r.brokerId}>{r.displayName}</li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
