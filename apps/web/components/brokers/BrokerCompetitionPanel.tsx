"use client";

import * as React from "react";

import type { BrokerCompetitionProfile } from "@/modules/brokers/broker-competition.types";
import { adjustLeadPricingWithCompetition } from "@/modules/leads/lead-competition-pricing.service";

export function BrokerCompetitionPanel() {
  const [profiles, setProfiles] = React.useState<BrokerCompetitionProfile[]>([]);
  const [note, setNote] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/broker-competition", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { profiles?: BrokerCompetitionProfile[]; note?: string; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setProfiles(j.profiles ?? []);
        setNote(j.note ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pricingPreview = React.useMemo(
    () => adjustLeadPricingWithCompetition({ score: 80, dynamicLeadPriceCents: 10_000 }, profiles),
    [profiles],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading broker competition…</p>
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-4"
      data-broker-competition-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Broker competition (V2)</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Rankings & tiers</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          {note ?? "Performance proxies from platform activity — assistive only; no auto-charge."}
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-200">Advisory pricing preview (high-score lead, $100 base)</p>
        <p className="mt-1">
          Suggested {(pricingPreview.suggestedPriceCents / 100).toFixed(2)} CAD ({pricingPreview.multiplier}×) —{" "}
          {pricingPreview.reason}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] uppercase text-zinc-500">
              <th className="py-2 pr-2">Broker</th>
              <th className="py-2 pr-2">Tier</th>
              <th className="py-2 pr-2">Response score</th>
              <th className="py-2 pr-2">Close proxy</th>
              <th className="py-2">Activity</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-zinc-500">
                  No broker monetization data yet.
                </td>
              </tr>
            ) : (
              profiles.map((p, i) => (
                <tr key={p.brokerId} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-2 font-mono text-xs text-zinc-300">
                    #{i + 1} {p.brokerId.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-2 capitalize text-amber-200/90">{p.tier}</td>
                  <td className="py-2 pr-2 tabular-nums">{p.responseTimeScore}</td>
                  <td className="py-2 pr-2 tabular-nums">{(p.closeRate * 100).toFixed(0)}%</td>
                  <td className="py-2 tabular-nums">{p.activityScore}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
