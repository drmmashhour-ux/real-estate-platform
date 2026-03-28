"use client";

import { useEffect, useState, type ReactNode } from "react";

type KpiPayload = {
  computedAt: string;
  daily_signups: number;
  daily_signups_prior_day: number;
  signups_last_7_days: { date: string; count: number }[];
  active_users_7d: number;
  activation_rate: number | null;
  activation_numerator: number;
  activation_denominator: number;
  conversion_rate: number | null;
  conversion_numerator: number;
  conversion_denominator: number;
  retention_rate: number | null;
  retention_numerator: number;
  retention_denominator: number;
  mrr: number | null;
  active_subscriptions: number;
  churn_rate: number | null;
  time_to_value_median_minutes: number | null;
  top_actions: string[];
  definitions: Record<string, string>;
};

function pct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function Trend({ current, prior }: { current: number; prior: number }) {
  if (prior === 0 && current === 0) return <span className="text-xs text-slate-500">vs prior day</span>;
  if (prior === 0) return <span className="text-xs text-emerald-400">↑ new</span>;
  const d = ((current - prior) / prior) * 100;
  const up = d >= 0;
  return (
    <span className={`text-xs ${up ? "text-emerald-400" : "text-rose-400"}`}>
      {up ? "↑" : "↓"} {Math.abs(d).toFixed(0)}% vs prior day
    </span>
  );
}

export function KPIDashboard({ className }: { className?: string }) {
  const [data, setData] = useState<KpiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/internal/kpi", { credentials: "include" });
        const j = (await res.json()) as { error?: string } & Partial<KpiPayload>;
        if (!res.ok) {
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setData(j as KpiPayload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 text-sm text-slate-400 ${className ?? ""}`}>
        Loading KPIs…
      </div>
    );
  }
  if (error) {
    return (
      <div className={`rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-200 ${className ?? ""}`}>
        {error}
      </div>
    );
  }
  if (!data) return null;

  const maxSignup = Math.max(1, ...data.signups_last_7_days.map((d) => d.count));

  return (
    <div className={`space-y-8 ${className ?? ""}`}>
      <p className="text-xs text-slate-500">Updated {new Date(data.computedAt).toLocaleString()} · UTC-based signups</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="New signups (today)"
          value={String(data.daily_signups)}
          hint={<Trend current={data.daily_signups} prior={data.daily_signups_prior_day} />}
          def={data.definitions.daily_signups}
        />
        <MetricCard
          label="Activation (30d cohort)"
          value={pct(data.activation_rate)}
          hint={`${data.activation_numerator} / ${data.activation_denominator} users`}
          def={data.definitions.activation_rate}
        />
        <MetricCard
          label="Conversion (30d cohort)"
          value={pct(data.conversion_rate)}
          hint={`${data.conversion_numerator} / ${data.conversion_denominator} paying`}
          def={data.definitions.conversion_rate}
        />
        <MetricCard
          label="Retention (proxy)"
          value={pct(data.retention_rate)}
          hint={`${data.retention_numerator} / ${data.retention_denominator} cohort`}
          def={data.definitions.retention_rate}
        />
        <MetricCard
          label="MRR"
          value={data.mrr != null ? `$${data.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
          hint={`${data.active_subscriptions} active subs`}
          def={data.definitions.mrr}
        />
        <MetricCard
          label="Churn (30d window)"
          value={data.churn_rate != null ? pct(data.churn_rate) : "—"}
          hint="See revenue module"
          def={data.definitions.churn_rate}
        />
        <MetricCard
          label="Time to value (median)"
          value={data.time_to_value_median_minutes != null ? `${data.time_to_value_median_minutes.toFixed(0)} min` : "—"}
          hint="Signup → first deal analysis"
          def={data.definitions.time_to_value_median_minutes}
        />
        <MetricCard
          label="Active users (7d)"
          value={String(data.active_users_7d)}
          hint="FSBO touch or Copilot run"
          def="Distinct users with listing update or Copilot run in last 7 days."
        />
      </div>

      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
        <h3 className="text-sm font-semibold text-premium-gold">Signups — last 7 days</h3>
        <div className="mt-4 flex h-32 items-end gap-1">
          {data.signups_last_7_days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[48px] rounded-t bg-premium-gold/80"
                style={{ height: `${(d.count / maxSignup) * 100}%`, minHeight: d.count ? 4 : 0 }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="max-w-full truncate text-[10px] text-slate-500">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      {data.top_actions.length > 0 ? (
        <section className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-5">
          <h3 className="text-sm font-semibold text-amber-200">Top actions</h3>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-100/90">
            {data.top_actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  def,
}: {
  label: string;
  value: string;
  hint: ReactNode;
  def: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-premium-gold/90">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white">{value}</p>
      <div className="mt-1">{hint}</div>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">{def}</p>
    </div>
  );
}
