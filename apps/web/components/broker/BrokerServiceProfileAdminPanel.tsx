"use client";

import * as React from "react";
import type { BrokerObservedProfileSignals } from "@/modules/broker/profile/broker-observed-profile-signals.service";
import type { BrokerProfileConfidenceLevel, BrokerServiceProfile } from "@/modules/broker/profile/broker-profile.types";

type Payload = {
  brokerId: string;
  declaredProfile: BrokerServiceProfile | null;
  observedProfileSignals: BrokerObservedProfileSignals | null;
  profileConfidence: BrokerProfileConfidenceLevel;
  mergeExplanationNotes: string[];
  disclaimer?: string;
};

function badge(c: BrokerProfileConfidenceLevel): string {
  if (c === "high") return "bg-emerald-500/15 text-emerald-100 border-emerald-500/35";
  if (c === "medium") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  return "bg-amber-500/15 text-amber-100 border-amber-500/35";
}

export function BrokerServiceProfileAdminPanel({ brokerId }: { brokerId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Payload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/brokers/${encodeURIComponent(brokerId)}/service-profile`, {
          credentials: "same-origin",
        });
        const j = (await res.json()) as Payload & { error?: string };
        if (!res.ok) {
          if (!cancelled) setErr(j.error ?? "Unable to load");
          return;
        }
        if (!cancelled) setData(j as Payload);
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brokerId]);

  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        Loading routing profile context…
      </section>
    );
  }

  if (err || !data) {
    return err ? (
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-500">{err}</section>
    ) : null;
  }

  const obs = data.observedProfileSignals;

  return (
    <section className="rounded-xl border border-violet-500/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.06),rgba(11,11,11,0.94))] p-4 text-white">
      <h2 className="text-sm font-semibold">Service profile & routing context</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Internal-only — declared JSON vs CRM-observed hints. Observed data never overwrites broker declarations automatically.
      </p>
      {data.disclaimer ? <p className="mt-2 text-[11px] text-slate-500">{data.disclaimer}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${badge(data.profileConfidence)}`}>
          Declared completeness: {data.profileConfidence}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
          <p className="font-semibold text-slate-200">Declared (editable by broker)</p>
          {data.declaredProfile ? (
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>
                Areas: {data.declaredProfile.serviceAreas.length ? data.declaredProfile.serviceAreas.map((a) => a.city).join(", ") : "—"}
              </li>
              <li>
                Focus:{" "}
                {data.declaredProfile.specializations.filter((s) => s.enabled).length
                  ? data.declaredProfile.specializations
                      .filter((s) => s.enabled)
                      .map((s) => s.propertyType)
                      .join(", ")
                  : "—"}
              </li>
              <li>Accepting leads: {data.declaredProfile.capacity.acceptingNewLeads ? "yes" : "no"}</li>
              <li>Languages: {data.declaredProfile.languages.map((l) => l.code).join(", ") || "—"}</li>
            </ul>
          ) : (
            <p className="mt-2 text-slate-500">No profile row.</p>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
          <p className="font-semibold text-slate-200">Observed CRM hints (read-only)</p>
          {obs ? (
            <ul className="mt-2 space-y-2 text-slate-400">
              <li>
                Cities (sample):{" "}
                {obs.observedServiceAreas.length
                  ? obs.observedServiceAreas.slice(0, 5).map((x) => `${x.city} (${x.leadCount})`).join(", ")
                  : "—"}
              </li>
              <li>
                Property buckets:{" "}
                {obs.observedSpecializations.length
                  ? obs.observedSpecializations.map((x) => `${x.propertyType} (${x.leadCount})`).join(", ")
                  : "—"}
              </li>
              <li className="text-[10px] text-slate-500">
                Sample: {obs.evidenceCounts.leadsSampled} leads / {obs.evidenceCounts.windowDays}d window
              </li>
              {obs.confidenceNotes.map((n, i) => (
                <li key={i} className="text-[10px] text-amber-200/90">
                  • {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-500">No observed bundle.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">Merge / confidence notes</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {data.mergeExplanationNotes.length ? (
            data.mergeExplanationNotes.map((n, i) => <li key={i}>{n}</li>)
          ) : (
            <li>No notes.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
