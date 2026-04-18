"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  heroClicks: number;
  intentSelections: number;
  leadFormStarts: number;
  leadSubmits: number;
  listingCtaClicks: number;
  propertyCtaClicks: number;
  brokerPreviewCtaClicks: number;
  surfaceViewsByKey: Record<string, number>;
};

type Alert = { level: string; code: string; message: string };

type FunnelRates = {
  homepage_ctr: number | null;
  get_leads_form_conversion: number | null;
  listings_ctr: number | null;
  property_contact_rate: number | null;
  broker_preview_ctr: number | null;
};

type ApiPayload = {
  snapshot: Snapshot;
  alerts: Alert[];
  recentEvents: { ts: string; kind: string; meta?: Record<string, unknown> }[];
  rollout: {
    killSwitch: boolean;
    mode: string;
    trace?: {
      killSwitchActive: boolean;
      mode: string;
      pathnameNormalized?: string;
      partialAllowlistPrefixes: string[];
      effectiveFlags: { conversionUpgradeV1: boolean; instantValueV1: boolean; realUrgencyV1: boolean };
    };
  };
  funnel?: {
    snapshot: Record<string, Record<string, number>>;
    rates: FunnelRates;
    dropoffs: { code: string; message: string }[];
    suggestions: { code: string; message: string }[];
    variants: Record<string, Record<string, Record<string, number>>>;
    bestVariants: { get_leads_submit_cta: string | null };
  };
};

export function ConversionMonitoringDashboard() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/conversion-monitoring", { credentials: "same-origin" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof json.error === "string" ? json.error : `HTTP ${res.status}`);
        }
        if (!cancelled) setData(json as ApiPayload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    }
    void load();
    const id = window.setInterval(load, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-400">Loading counters…</p>;
  }

  const s = data.snapshot;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-900/40 bg-black/60 px-4 py-3 text-xs text-amber-100/90">
        <p className="font-semibold text-amber-300">Non-persistent (per process)</p>
        <p className="mt-1 text-slate-400">
          Counters live in server memory only; they reset on deploy/restart and are not shared across instances. Use for
          smoke checks and rollout sanity, not finance or SLA reporting.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
        <p className="font-semibold text-white">Rollout (traceable)</p>
        <p className="mt-1 font-mono text-[11px]">
          killSwitch={String(data.rollout.killSwitch)} · mode={data.rollout.mode}
        </p>
        {data.rollout.trace ? (
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/50 p-2 text-[9px] leading-relaxed text-slate-400">
            {JSON.stringify(data.rollout.trace, null, 2)}
          </pre>
        ) : null}
      </div>

      {data.funnel ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-xs text-slate-200">
          <p className="font-semibold text-emerald-200">Funnel visibility (same process limits apply)</p>
          <ul className="mt-2 grid gap-2 font-mono text-[10px] text-slate-300 sm:grid-cols-2">
            <li>
              Homepage CTR (CTA_click / page_view):{" "}
              <span className="text-white">{pct(data.funnel.rates.homepage_ctr)}</span>
            </li>
            <li>
              Get-leads form (submit / start):{" "}
              <span className="text-white">{pct(data.funnel.rates.get_leads_form_conversion)}</span>
            </li>
            <li>
              Listings (CTA / listing_view):{" "}
              <span className="text-white">{pct(data.funnel.rates.listings_ctr)}</span>
            </li>
            <li>
              Property (contact / view):{" "}
              <span className="text-white">{pct(data.funnel.rates.property_contact_rate)}</span>
            </li>
            <li className="sm:col-span-2">
              Broker preview (CTA / preview_view):{" "}
              <span className="text-white">{pct(data.funnel.rates.broker_preview_ctr)}</span>
            </li>
          </ul>
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[9px] text-slate-500">
            {JSON.stringify(data.funnel.snapshot, null, 2)}
          </pre>
          <p className="mt-2 text-[10px] text-slate-500">
            Best submit CTA variant (A/B):{" "}
            <span className="font-mono text-emerald-100/90">
              {data.funnel.bestVariants.get_leads_submit_cta ?? "—"}
            </span>
          </p>
          <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-black/40 p-2 text-[9px] text-slate-500">
            {JSON.stringify(data.funnel.variants, null, 2)}
          </pre>
          {data.funnel.dropoffs.length > 0 ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="font-semibold text-amber-300">Drop-off signals</p>
              <ul className="mt-1 space-y-1 text-[11px] text-amber-100/90">
                {data.funnel.dropoffs.map((d) => (
                  <li key={d.code}>
                    <span className="font-mono text-[10px]">{d.code}</span> — {d.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.funnel.suggestions.length > 0 ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="font-semibold text-cyan-200">Auto suggestions</p>
              <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
                {data.funnel.suggestions.map((x) => (
                  <li key={x.code}>
                    <span className="font-mono text-[10px] text-cyan-400/90">{x.code}</span> — {x.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Lead form starts" value={s.leadFormStarts} hint="recordLeadFormStart (once per tab session)" />
        <Metric label="Lead submits (success)" value={s.leadSubmits} hint="recordLeadSubmit after HTTP success" />
        <Metric label="Listing CTA clicks" value={s.listingCtaClicks} hint="listing grid opportunity CTAs" />
        <Metric label="Property CTA clicks" value={s.propertyCtaClicks} hint="listing detail CTAs" />
        <Metric label="Broker preview CTA" value={s.brokerPreviewCtaClicks} hint="broker lead preview" />
        <Metric label="Hero / intent (legacy)" value={s.heroClicks + s.intentSelections} hint="hero + intent counters" />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
        <p className="text-xs font-semibold text-white">Surface impressions</p>
        <pre className="mt-2 max-h-40 overflow-auto font-mono text-[10px] text-slate-400">
          {JSON.stringify(s.surfaceViewsByKey, null, 2)}
        </pre>
      </div>

      {data.alerts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Alerts</p>
          <ul className="space-y-2">
            {data.alerts.map((a) => (
              <li
                key={a.code}
                className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100"
              >
                <span className="font-mono text-[11px] text-amber-300/90">{a.code}</span>
                <p className="mt-1 text-slate-200">{a.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-slate-500">No heuristic alerts for current counters.</p>
      )}

      {process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG === "1" ? (
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-3">
          <p className="text-xs font-semibold text-cyan-200">Recent events (debug)</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Requires NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG=1 in the browser bundle for full stream.
          </p>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto font-mono text-[10px] text-slate-400">
            {data.recentEvents.slice(-10).map((e, i) => (
              <li key={`${e.ts}-${i}`}>
                {e.kind}
                {e.meta?.surface != null ? ` · ${String(e.meta.surface)}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v}%`;
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-slate-500">{hint}</p>
    </div>
  );
}
