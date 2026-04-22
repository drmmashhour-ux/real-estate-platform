"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Tier = "admin" | "growth";

type Kpis = {
  leadsToday: number;
  leadsWeek: number;
  highQualityPct: number | null;
  visitsBookedWeek: number;
  conversionsWeek: number;
  avgResponseTimeHours: number | null;
  avgLeadPriceCad: number | null;
  revenueDailyCad: number | null;
  revenueMonthlyCad: number | null;
};

export function SeniorCommandCenterClient(props: {
  locale: string;
  country: string;
  tier: Tier;
}) {
  const base = `/api/senior/command`;
  const dash = `/${props.locale}/${props.country}/dashboard`;

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [hot, setHot] = useState<
    Array<{
      id: string;
      requesterName: string;
      urgency: string;
      budget: number | null;
      careLevel: string | null;
      residenceName: string;
      residenceCity: string;
      operatorName: string | null;
      status: string;
      score: number | null;
      band: string | null;
    }>
  >([]);
  const [stuck, setStuck] = useState<Array<{ leadId: string; residenceName: string; issue: string; status: string }>>(
    [],
  );
  const [operators, setOperators] = useState<
    Array<{
      operatorId: string;
      operatorName: string;
      primaryResidenceId: string | null;
      avgResponseHours: number | null;
      conversionRate: number | null;
      rankingScore: number | null;
      trustScore: number | null;
      tier: string;
    }>
  >([]);
  const [areas, setAreas] = useState<
    Array<{ city: string; leads: number; demandSignal: string; supplySignal: string; revenueCad: number | null }>
  >([]);
  const [pricing, setPricing] = useState<
    Array<{
      id: string;
      city: string | null;
      leadBasePrice: number;
      minPrice: number;
      maxPrice: number;
      demandFactor: number;
      qualityFactor: number;
    }>
  >([]);
  const [activity, setActivity] = useState<Array<{ at: string; label: string }>>([]);
  const [insights, setInsights] = useState<Array<{ title: string; detail: string }>>([]);
  const [alerts, setAlerts] = useState<Array<{ id: string; severity: string; message: string }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [leadModalId, setLeadModalId] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<unknown>(null);
  const [pricingDraft, setPricingDraft] = useState<Record<string, { demand: string; quality: string }>>({});

  const load = useCallback(async () => {
    try {
      async function j<T>(path: string): Promise<T> {
        const res = await fetch(path);
        const data = (await res.json()) as T & { error?: string };
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        return data as T;
      }
      const [
        k,
        h,
        s,
        o,
        a,
        p,
        act,
        ins,
        al,
      ] = await Promise.all([
        j<Kpis>(`${base}/kpis`),
        j<{ leads: typeof hot }>(`${base}/hot-leads`),
        j<{ stuck: typeof stuck }>(`${base}/stuck-deals`),
        j<{ operators: typeof operators }>(`${base}/operators`),
        j<{ areas: typeof areas }>(`${base}/areas`),
        j<{ rules: typeof pricing }>(`${base}/pricing`),
        j<{ activity: typeof activity }>(`${base}/activity`),
        j<{ insights: typeof insights }>(`${base}/insights`),
        j<{ alerts: typeof alerts }>(`${base}/alerts`),
      ]);
      setKpis(k);
      setHot(h.leads ?? []);
      setStuck(s.stuck ?? []);
      setOperators(o.operators ?? []);
      setAreas(a.areas ?? []);
      setPricing(p.rules ?? []);
      setActivity(act.activity ?? []);
      setInsights(ins.insights ?? []);
      setAlerts(al.alerts ?? []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [base]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 28000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!leadModalId) {
      setLeadDetail(null);
      return;
    }
    void fetch(`${base}/leads/${encodeURIComponent(leadModalId)}`)
      .then((r) => r.json())
      .then(setLeadDetail)
      .catch(() => setLeadDetail(null));
  }, [leadModalId, base]);

  async function postLeadAction(id: string, action: string) {
    await fetch(`${base}/leads/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void load();
  }

  async function applyPricing(rule: {
    id: string;
    demandFactor: number;
    qualityFactor: number;
    leadBasePrice: number;
    minPrice: number;
    maxPrice: number;
  }) {
    const d = pricingDraft[rule.id];
    const demandRaw = d?.demand?.trim();
    const qualityRaw = d?.quality?.trim();
    const demandFactor =
      demandRaw !== undefined && demandRaw !== "" ? Number(demandRaw) : rule.demandFactor;
    const qualityFactor =
      qualityRaw !== undefined && qualityRaw !== "" ? Number(qualityRaw) : rule.qualityFactor;
    const res = await fetch(`${base}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rule.id,
        demandFactor: Number.isFinite(demandFactor) ? demandFactor : rule.demandFactor,
        qualityFactor: Number.isFinite(qualityFactor) ? qualityFactor : rule.qualityFactor,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error ?? "Could not update");
      return;
    }
    alert(j.message ?? "Saved");
    void load();
  }

  const exportHref = (type: string) =>
    `${base}/export?type=${encodeURIComponent(type)}&format=csv`;

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Senior Living</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Operational brain for leads, operators, geography, and pricing — refreshed automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`${dash}/senior`} className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-teal-300 hover:bg-slate-900">
              Operator CRM
            </Link>
            <Link href={`${dash}/analytics/senior`} className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-900">
              AI analytics
            </Link>
          </div>
        </header>

        {alerts.length > 0 ?
          <section className="space-y-2 rounded-xl border border-rose-900/60 bg-rose-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-300">Alerts</p>
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="flex gap-2 text-sm">
                  <span aria-hidden>{a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟠" : "🔵"}</span>
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </section>
        : null}

        {err ?
          <p className="rounded-lg border border-amber-700 bg-amber-950/50 p-4 text-amber-200" role="alert">
            {err}
          </p>
        : null}

        {/* KPI BAR */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Kpi label="Leads today" value={kpis?.leadsToday ?? "—"} sub="vs week" />
          <Kpi label="Leads (7d)" value={kpis?.leadsWeek ?? "—"} sub="volume" />
          <Kpi label="High-quality %" value={kpis?.highQualityPct != null ? `${kpis.highQualityPct}%` : "—"} sub="scored" />
          <Kpi label="Visits (7d)" value={kpis?.visitsBookedWeek ?? "—"} sub="events" />
          <Kpi label="Conversions (7d)" value={kpis?.conversionsWeek ?? "—"} sub="closed + events" />
          <Kpi label="Avg response (h)" value={kpis?.avgResponseTimeHours ?? "—"} sub="operators" />
          <Kpi label="Avg lead $" value={kpis?.avgLeadPriceCad != null ? `$${kpis.avgLeadPriceCad}` : "—"} sub="CAD est." />
          <Kpi
            label="Revenue est."
            value={
              kpis?.revenueMonthlyCad != null ? `$${Math.round(kpis.revenueMonthlyCad)}`
              : kpis?.revenueDailyCad != null ?
                `$${kpis.revenueDailyCad}/d`
              : "—"
            }
            sub="month / day"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* HOT LEADS */}
          <Panel title="Hot leads" subtitle="High score / conversion signals">
            <ul className="divide-y divide-slate-800">
              {hot.length === 0 ?
                <li className="py-6 text-center text-slate-500">No hot leads match filters yet.</li>
              : hot.map((l) => (
                  <li key={l.id} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setLeadModalId(l.id)}
                        className="text-left font-semibold text-teal-300 hover:underline"
                      >
                        {l.requesterName}
                      </button>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold uppercase text-slate-300">
                        {l.band ?? "—"} · {l.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {l.residenceName} · {l.residenceCity}
                      {l.operatorName ?
                        <span className="text-slate-500"> · {l.operatorName}</span>
                      : null}
                    </p>
                    <p className="text-xs text-slate-500">
                      Care: {l.careLevel ?? "—"} · Budget: {l.budget != null ? `$${Math.round(l.budget)}` : "—"} · Status:{" "}
                      {l.status}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <MiniBtn onClick={() => void postLeadAction(l.id, "NUDGE_OPERATOR")}>Nudge operator</MiniBtn>
                      <MiniBtn onClick={() => void postLeadAction(l.id, "PRIORITIZE_FOLLOWUP")}>Prioritize</MiniBtn>
                      <MiniBtn onClick={() => void postLeadAction(l.id, "MARK_CONTACTED")}>Mark contacted</MiniBtn>
                    </div>
                  </li>
                ))
              }
            </ul>
          </Panel>

          {/* STUCK */}
          <Panel title="Stuck deals" subtitle="SLA risk & friction">
            <ul className="divide-y divide-slate-800">
              {stuck.length === 0 ?
                <li className="py-6 text-center text-slate-500">No stuck patterns detected.</li>
              : stuck.map((s) => (
                  <li key={s.leadId} className="py-3 text-sm">
                    <button
                      type="button"
                      className="font-mono text-xs text-teal-400 hover:underline"
                      onClick={() => setLeadModalId(s.leadId)}
                    >
                      {s.leadId.slice(0, 10)}…
                    </button>
                    <p className="font-medium text-slate-200">{s.residenceName}</p>
                    <p className="text-slate-500">{s.issue}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MiniBtn onClick={() => void postLeadAction(s.leadId, "ESCALATE")}>Escalate</MiniBtn>
                      <MiniBtn onClick={() => void postLeadAction(s.leadId, "NUDGE_OPERATOR")}>Follow-up suggestion</MiniBtn>
                    </div>
                  </li>
                ))
              }
            </ul>
          </Panel>

          {/* OPERATORS */}
          <Panel title="Operator performance" subtitle="Ranking blend · trust">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-slate-700 text-slate-500">
                  <tr>
                    <th className="py-2 pr-2">Operator</th>
                    <th className="py-2 pr-2">Resp (h)</th>
                    <th className="py-2 pr-2">Conv</th>
                    <th className="py-2 pr-2">Rank</th>
                    <th className="py-2 pr-2">Trust</th>
                    <th className="py-2">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((o) => (
                    <tr key={o.operatorId} className="border-b border-slate-800/80">
                      <td className="py-2 pr-2">
                        {o.primaryResidenceId ?
                          <Link
                            href={`${dash}/senior/operators/${o.primaryResidenceId}`}
                            className="font-semibold text-teal-300 hover:underline"
                          >
                            {o.operatorName}
                          </Link>
                        : <span className="font-semibold">{o.operatorName}</span>}
                      </td>
                      <td className="py-2 pr-2">{o.avgResponseHours ?? "—"}</td>
                      <td className="py-2 pr-2">{fmtPct(o.conversionRate)}</td>
                      <td className="py-2 pr-2">{o.rankingScore != null ? Math.round(o.rankingScore) : "—"}</td>
                      <td className="py-2 pr-2">{fmtPct(o.trustScore)}</td>
                      <td className={`py-2 font-bold uppercase ${tierColor(o.tier)}`}>{o.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Actions affect ranking boosts within [-5, 5] platform guardrails.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {operators.slice(0, 4).map((o) => (
                <span key={`act-${o.operatorId}`} className="flex gap-1">
                  <MiniBtn
                    onClick={() =>
                      void fetch(`${base}/operators/${o.operatorId}/boost`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ delta: 2 }),
                      }).then(() => load())
                    }
                  >
                    Boost {o.operatorName.slice(0, 12)}
                  </MiniBtn>
                  <MiniBtn
                    onClick={() =>
                      void fetch(`${base}/operators/${o.operatorId}/boost`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ delta: -2 }),
                      }).then(() => load())
                    }
                  >
                    Reduce vis.
                  </MiniBtn>
                </span>
              ))}
            </div>
          </Panel>

          {/* AREAS */}
          <Panel title="Area heatmap" subtitle="Demand vs supply signals">
            <ul className="divide-y divide-slate-800 text-sm">
              {areas.slice(0, 10).map((a) => (
                <li key={a.city} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="font-semibold">{a.city}</span>
                  <span className="text-slate-400">
                    Leads {a.leads} · Demand {a.demandSignal} · Supply {a.supplySignal}
                  </span>
                  <span className="text-xs text-slate-500">
                    Rev ~ ${a.revenueCad != null ? Math.round(a.revenueCad) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* PRICING */}
          <Panel title="Pricing control" subtitle={props.tier === "admin" ? "Admin multipliers" : "View-only — admin adjusts"}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-700 text-slate-500">
                  <tr>
                    <th className="py-2">City</th>
                    <th className="py-2">Base</th>
                    <th className="py-2">Demand</th>
                    <th className="py-2">Quality</th>
                    <th className="py-2">Min–Max</th>
                    {props.tier === "admin" ?
                      <th className="py-2">Apply</th>
                    : null}
                  </tr>
                </thead>
                <tbody>
                  {pricing.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-b border-slate-800/80">
                      <td className="py-2">{r.city ?? "Default"}</td>
                      <td className="py-2">${r.leadBasePrice}</td>
                      <td className="py-2">
                        {props.tier === "admin" ?
                          <input
                            className="w-16 rounded border border-slate-600 bg-slate-900 px-1 py-0.5 text-slate-100"
                            defaultValue={String(r.demandFactor)}
                            onChange={(e) =>
                              setPricingDraft((prev) => ({
                                ...prev,
                                [r.id]: { ...(prev[r.id] ?? { demand: "", quality: "" }), demand: e.target.value },
                              }))
                            }
                          />
                        : r.demandFactor}
                      </td>
                      <td className="py-2">
                        {props.tier === "admin" ?
                          <input
                            className="w-16 rounded border border-slate-600 bg-slate-900 px-1 py-0.5 text-slate-100"
                            defaultValue={String(r.qualityFactor)}
                            onChange={(e) =>
                              setPricingDraft((prev) => ({
                                ...prev,
                                [r.id]: { ...(prev[r.id] ?? { demand: "", quality: "" }), quality: e.target.value },
                              }))
                            }
                          />
                        : r.qualityFactor}
                      </td>
                      <td className="py-2 text-slate-400">
                        ${r.minPrice} – ${r.maxPrice}
                      </td>
                      {props.tier === "admin" ?
                        <td className="py-2">
                          <button
                            type="button"
                            className="rounded bg-teal-800 px-2 py-1 text-[11px] font-bold text-white hover:bg-teal-700"
                            onClick={() => void applyPricing(r)}
                          >
                            Save
                          </button>
                        </td>
                      : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ACTIVITY + INSIGHTS */}
          <Panel title="Live activity" subtitle="Polling ~28s">
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {activity.map((a, i) => (
                <li key={`${a.at}-${i}`} className="flex gap-2 border-b border-slate-800/60 pb-2">
                  <span className="shrink-0 font-mono text-xs text-slate-500">
                    {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* AI INSIGHTS full width */}
        <Panel title="AI insights" subtitle="Generated from current funnel">
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.map((n) => (
              <li key={n.title} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <p className="font-semibold text-teal-300">{n.title}</p>
                <p className="mt-2 text-sm text-slate-300">{n.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>

        {/* EXPORT */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm font-semibold text-slate-200">Export / reporting</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a className="text-teal-400 underline" href={exportHref("leads")}>
              CSV leads
            </a>
            <a className="text-teal-400 underline" href={exportHref("performance")}>
              CSV performance
            </a>
            <a className="text-teal-400 underline" href={exportHref("revenue")}>
              CSV pricing & revenue inputs
            </a>
            <span className="text-slate-500">PDF: use CSV → investor template (501 placeholder on API).</span>
          </div>
        </section>
      </div>

      {leadModalId ?
        <LeadModal
          detail={leadDetail}
          onClose={() => setLeadModalId(null)}
          onAction={(action) => {
            void postLeadAction(leadModalId, action);
          }}
        />
      : null}
    </div>
  );
}

function Kpi(props: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-1 text-lg font-bold text-teal-300">{props.value}</p>
      <p className="text-[10px] text-slate-600">{props.sub}</p>
    </div>
  );
}

function Panel(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">{props.title}</h2>
        {props.subtitle ?
          <p className="text-xs text-slate-500">{props.subtitle}</p>
        : null}
      </div>
      {props.children}
    </section>
  );
}

function MiniBtn(props: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
    >
      {props.children}
    </button>
  );
}

function tierColor(t: string): string {
  if (t === "green") return "text-emerald-400";
  if (t === "red") return "text-rose-400";
  return "text-amber-300";
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const v = n <= 1 ? n * 100 : n;
  return `${Math.round(v)}%`;
}

function LeadModal(props: {
  detail: unknown;
  onClose: () => void;
  onAction: (a: string) => void;
}) {
  const d = props.detail as {
    lead?: { requesterName?: string; email?: string; status?: string; budget?: number | null };
    residence?: { name?: string; city?: string };
    scores?: { legacy?: unknown; ai?: unknown };
    features?: unknown;
  } | null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") props.onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-white">Lead detail</h3>
          <button type="button" className="text-slate-400 hover:text-white" onClick={props.onClose}>
            ✕
          </button>
        </div>
        {!d?.lead ?
          <p className="mt-4 text-slate-400">Loading…</p>
        : (
          <>
            <p className="mt-4 font-semibold text-teal-300">{d.lead.requesterName}</p>
            <p className="text-sm text-slate-400">{d.lead.email}</p>
            <p className="mt-3 text-sm text-slate-300">
              {d.residence?.name} · {d.residence?.city}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Status: {d.lead.status} · Budget: {d.lead.budget != null ? `$${d.lead.budget}` : "—"}
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-400">
              {JSON.stringify({ scores: d.scores, features: d.features }, null, 2)}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <MiniBtn onClick={() => props.onAction("PRIORITIZE_FOLLOWUP")}>Prioritize follow-up</MiniBtn>
              <MiniBtn onClick={() => props.onAction("MARK_CONTACTED")}>Mark contacted</MiniBtn>
              <MiniBtn onClick={() => props.onAction("REASSIGN_PLACEHOLDER")}>Reassign (ops)</MiniBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
