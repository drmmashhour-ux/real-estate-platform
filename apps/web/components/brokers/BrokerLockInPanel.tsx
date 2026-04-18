"use client";

import * as React from "react";

import type { BrokerLockInSignal } from "@/modules/brokers/broker-lockin.types";
import { BROKER_LOCKIN_TIER_RULES } from "@/modules/brokers/broker-lockin-tiers";
import { getBrokerRetentionActions } from "@/modules/brokers/broker-lockin-strategy.service";

function tierBadgeClass(tier: BrokerLockInSignal["tier"]): string {
  if (tier === "elite") return "bg-amber-500/20 text-amber-200 border-amber-500/40";
  if (tier === "preferred") return "bg-sky-500/20 text-sky-200 border-sky-500/40";
  return "bg-zinc-700/50 text-zinc-300 border-zinc-600";
}

function tierDisplay(tier: BrokerLockInSignal["tier"]): string {
  return tier === "elite" ? "ELITE" : tier === "preferred" ? "PREFERRED" : "STANDARD";
}

export function BrokerLockInPanel() {
  const [signals, setSignals] = React.useState<BrokerLockInSignal[]>([]);
  const [note, setNote] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const retention = React.useMemo(() => getBrokerRetentionActions(), []);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/broker-lockin", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { signals?: BrokerLockInSignal[]; note?: string; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setSignals(j.signals ?? []);
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

  const ranked = React.useMemo(
    () => [...signals].sort((a, b) => b.dependencyScore - a.dependencyScore),
    [signals],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading broker lock-in signals…</p>
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
      data-broker-lockin-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Broker lock-in (V1)</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Dependency · retention · tiers</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          {note ?? "Read-only indices — fair routing beats manipulation."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {( ["ELITE", "PREFERRED", "STANDARD"] as const).map((key) => {
          const rules = BROKER_LOCKIN_TIER_RULES[key];
          return (
            <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
              <p className="font-semibold text-zinc-200">{key}</p>
              <p className="mt-1 text-xs text-zinc-500">{rules.summary}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-400">
                {rules.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/25 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Retention actions (policy — manual)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
          {retention.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <th className="py-2 pr-2">Rank</th>
              <th className="py-2 pr-2">Broker</th>
              <th className="py-2 pr-2">Tier</th>
              <th className="py-2 pr-2">Dependency</th>
              <th className="py-2">Factors (excerpt)</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-zinc-500">
                  No broker monetization signals yet — tiers apply when activity exists.
                </td>
              </tr>
            ) : (
              ranked.map((s, i) => (
                <tr key={s.brokerId} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-2 text-zinc-500">{i + 1}</td>
                  <td className="py-2 pr-2 font-mono text-xs text-zinc-300">
                    {s.brokerId.length > 14 ? `${s.brokerId.slice(0, 12)}…` : s.brokerId}
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tierBadgeClass(s.tier)}`}
                    >
                      {tierDisplay(s.tier)}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-zinc-200">{(s.dependencyScore * 100).toFixed(0)}%</td>
                  <td className="py-2 text-xs text-zinc-500">
                    {s.factors.slice(0, 2).join(" · ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
