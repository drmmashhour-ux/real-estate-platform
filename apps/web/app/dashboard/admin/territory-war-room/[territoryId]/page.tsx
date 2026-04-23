"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  autonomyGlassCard,
  autonomyGoldText,
  autonomyMuted,
} from "@/components/autonomy/autonomy-styles";

type WarRoomPhase = "DISCOVERY" | "LAUNCH" | "EXPAND" | "DOMINATE";

type Payload = {
  generatedAt: string;
  territoryId: string;
  territoryName: string;
  regionLabel?: string;
  disclaimers: string[];
  header: {
    cityName: string;
    phase: WarRoomPhase;
    phaseDerived: WarRoomPhase;
    expansionScore: number | null;
    expansionBand: string | null;
    status: string;
    paused: boolean;
    scaling: boolean;
    dominationScore: number;
  };
  ops: {
    phaseOverride: string | null;
    expansionPlanNote: string | null;
    playbookPhase: string | null;
    playbookCompletionPercent: number | null;
  };
  coreMetrics: {
    leadsGenerated: {
      today: number | null;
      week: number | null;
      territoryRollingProxy: number;
      note: string;
    };
    activeListings: number;
    brokersOnboarded: number;
    visitsBookedToday: number | null;
    visitsBookedWeek: number | null;
    visitsNote: string;
    dealsInProgress: number | null;
    dealsNote: string;
    revenueBand: string;
    revenueCentsProxy: number;
    conversionRate: number;
  };
  supplyDemand: {
    listingsSupply: number;
    buyerDemand: number;
    renterDemand: number;
    ratio: number;
    gapSummary: string;
    highlight: string;
  };
  hubPerformance: Array<{
    label: string;
    hub: string;
    activityBand: string;
    activityScore: number;
    growthNote: string;
    gapNote: string;
  }>;
  dealIntelligence: {
    dealsOpenCount?: number | null;
    priorityDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    stalledDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    highProbabilityDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    quickActionNote: string;
  };
  marketing: {
    activeCampaignsMtd: number | null;
    seoDrafts: number | null;
    bnhubGrowthCampaigns: number | null;
    contentPosted: number | null;
    leadSourcesNote: string | null;
    engagementNote: string | null;
  };
  blockers: Array<{
    id: string;
    title: string;
    reason: string;
    severity: string;
    suggestedFix: string;
    source: string;
  }>;
  nextActions: Array<{
    id: string;
    title: string;
    priority: number;
    rationale: string;
    dataBasis: string;
    href?: string | null;
  }>;
  expansion: {
    title: string;
    summary: string;
    entryHub: string;
    phasedPlanSummary: string;
    linkSelfExpansion: string;
  } | null;
  capitalAllocatorNote: string;
  map: { enabled: boolean; message: string };
};

function statusStyles(status: string) {
  if (status === "Healthy") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (status === "At Risk") return "border-amber-500/50 bg-amber-950/30 text-amber-100";
  return "border-red-500/50 bg-red-950/35 text-red-100";
}

function severityDot(sev: string) {
  if (sev === "high") return "bg-red-400";
  if (sev === "medium") return "bg-amber-400";
  return "bg-zinc-500";
}

export default function TerritoryWarRoomPage() {
  const params = useParams();
  const territoryId = typeof params?.territoryId === "string" ? params.territoryId : "";
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [phaseOverride, setPhaseOverride] = useState<string>("");
  const [paused, setPaused] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [planNote, setPlanNote] = useState("");

  const load = useCallback(async () => {
    if (!territoryId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/territory-war-room/${territoryId}`, { credentials: "same-origin" });
      const j = (await res.json().catch(() => ({}))) as Payload & { error?: string };
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "load_failed");
        setData(null);
        return;
      }
      setData(j);
      setPhaseOverride(j.ops.phaseOverride ?? "");
      setPaused(j.header.paused);
      setScaling(j.header.scaling);
      setPlanNote(j.ops.expansionPlanNote ?? "");
    } catch {
      setError("network_error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [territoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncControlsFromPayload = useCallback((p: Payload) => {
    setPhaseOverride(p.ops.phaseOverride ?? "");
    setPaused(p.header.paused);
    setScaling(p.header.scaling);
    setPlanNote(p.ops.expansionPlanNote ?? "");
  }, []);

  const onSaveOps = async () => {
    if (!territoryId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (phaseOverride === "") body.phaseOverride = null;
      else body.phaseOverride = phaseOverride as WarRoomPhase;
      body.paused = paused;
      body.scaling = scaling;
      body.expansionPlanNote = planNote.trim() === "" ? null : planNote.trim();

      const res = await fetch(`/api/admin/territory-war-room/${territoryId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as Payload & { error?: string };
      if (!res.ok) {
        setSaveMsg(typeof j?.error === "string" ? j.error : "save_failed");
        return;
      }
      if ("territoryId" in j && j.territoryId) {
        setData(j as Payload);
        syncControlsFromPayload(j as Payload);
      }
      setSaveMsg("Saved.");
    } catch {
      setSaveMsg("network_error");
    } finally {
      setSaving(false);
    }
  };

  const highlightSupply = useMemo(() => {
    if (!data) return null;
    const g = data.supplyDemand.gapSummary;
    if (g === "high_demand_low_supply") {
      return { text: "High demand, low supply", className: "text-amber-200 border-amber-500/40 bg-amber-950/40" };
    }
    if (g === "oversupply_low_conversion") {
      return { text: "Oversupply, low conversion", className: "text-rose-200 border-rose-500/40 bg-rose-950/35" };
    }
    return {
      text: data.supplyDemand.highlight,
      className: "text-[#e8dfd0] border-[#D4AF37]/25 bg-black/40",
    };
  }, [data]);

  if (!territoryId) {
    return (
      <div className="min-h-screen bg-black px-4 py-10 text-[#f4efe4]">
        <p className="text-sm text-[#b8b3a8]">Missing territory.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-[#f4efe4] pb-24 md:pb-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/dashboard/admin/market-domination" className="text-sm text-[#D4AF37] hover:underline">
              ← Territories
            </Link>
            <p className={`mt-2 text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Territory War Room</p>
            <h1 className={`mt-1 font-serif text-3xl md:text-4xl ${autonomyGoldText}`}>
              {data?.header.cityName ?? "…"}
            </h1>
            {data?.regionLabel ?
              <p className={`mt-1 text-sm ${autonomyMuted}`}>{data.regionLabel}</p>
            : null}
          </div>
          {data ?
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles(data.header.status)}`}
              >
                {data.header.status}
              </span>
              {data.header.paused ?
                <span className="rounded-full border border-zinc-600 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200">
                  Paused
                </span>
              : null}
              {data.header.scaling ?
                <span className="rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 text-xs text-[#D4AF37]">
                  Scaling
                </span>
              : null}
            </div>
          : null}
        </div>

        {/* Mobile-first strip: summary + blockers + actions */}
        {data ?
          <section className={`${autonomyGlassCard} space-y-3 p-4 md:hidden`}>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${autonomyMuted}`}>Today&apos;s pulse</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className={autonomyMuted}>Phase</p>
                <p className="font-semibold text-[#f4efe4]">{data.header.phase}</p>
              </div>
              <div>
                <p className={autonomyMuted}>Domination</p>
                <p className="font-semibold text-[#f4efe4]">{Math.round(data.header.dominationScore)}</p>
              </div>
              <div>
                <p className={autonomyMuted}>Leads (d/w)</p>
                <p className="font-semibold text-[#f4efe4]">
                  {data.coreMetrics.leadsGenerated.today ?? "—"} / {data.coreMetrics.leadsGenerated.week ?? "—"}
                </p>
              </div>
              <div>
                <p className={autonomyMuted}>Blockers</p>
                <p className="font-semibold text-amber-100">{data.blockers.length}</p>
              </div>
              <div>
                <p className={autonomyMuted}>Top action</p>
                <p className="line-clamp-2 text-xs text-[#e8dfd0]">{data.nextActions[0]?.title ?? "—"}</p>
              </div>
            </div>
          </section>
        : null}

        {loading ?
          <p className={`text-sm ${autonomyMuted}`}>Loading operational picture…</p>
        : null}
        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
        : null}

        {!loading && data ?
          <>
            <header className={`${autonomyGlassCard} grid gap-6 p-6 md:grid-cols-[1fr_auto]`}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.2em] ${autonomyMuted}`}>Phase (display)</p>
                    <p className="mt-1 text-2xl font-semibold tracking-wide text-[#f4efe4]">{data.header.phase}</p>
                    <p className={`mt-1 text-xs ${autonomyMuted}`}>
                      Derived: {data.header.phaseDerived}
                      {data.ops.phaseOverride ? " · override active" : ""}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.2em] ${autonomyMuted}`}>Expansion score</p>
                    <p className="mt-1 text-2xl font-semibold text-[#f4efe4]">
                      {data.header.expansionScore ?? "—"}
                      {data.header.expansionBand ?
                        <span className={`ml-2 text-sm font-normal ${autonomyMuted}`}>({data.header.expansionBand})</span>
                      : null}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.2em] ${autonomyMuted}`}>Domination score</p>
                    <p className="mt-1 text-2xl font-semibold text-[#f4efe4]">{Math.round(data.header.dominationScore)}</p>
                  </div>
                </div>
                <p className={`text-xs ${autonomyMuted}`}>
                  Playbook phase: {data.ops.playbookPhase ?? "—"} · Completion:{" "}
                  {data.ops.playbookCompletionPercent ?? "—"}
                  {typeof data.ops.playbookCompletionPercent === "number" ? "%" : ""}
                </p>
              </div>
              <div className={`rounded-xl border ${autonomyMuted} border-[#D4AF37]/15 bg-black/40 p-4 text-xs leading-relaxed`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9b667]">Signals</p>
                <p className="mt-2">
                  Execution view ties Market Domination, city launch playbook, self-expansion scoring, pipeline slices,
                  and booking windows. Every metric below states its basis — use this daily to decide what to unblock
                  next.
                </p>
              </div>
            </header>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Core metrics</h2>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>
                Territory-level where marked; bookings/deals counts are platform-wide until geo attribution ships.
              </p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Lead proxy (rolling)"
                  value={String(data.coreMetrics.leadsTerritoryProxy.rolling)}
                  hint={data.coreMetrics.leadsTerritoryProxy.note}
                />
                <MetricCard label="Active listings" value={String(data.coreMetrics.activeListings)} hint="Territory.metrics" />
                <MetricCard
                  label="Brokers onboarded"
                  value={String(data.coreMetrics.brokersOnboarded)}
                  hint="Territory.metrics.activeBrokers"
                />
                <MetricCard
                  label="Visits booked"
                  value={`${data.coreMetrics.visitsBookedToday ?? "—"} today / ${data.coreMetrics.visitsBookedWeek ?? "—"} wk`}
                  hint={data.coreMetrics.visitsNote}
                />
                <MetricCard
                  label="Deals in progress"
                  value={data.coreMetrics.dealsInProgress === null ? "—" : String(data.coreMetrics.dealsInProgress)}
                  hint={data.coreMetrics.dealsNote}
                />
                <MetricCard
                  label="Revenue"
                  value={data.coreMetrics.revenueBand}
                  hint={`Proxy band · ${formatMoney(data.coreMetrics.revenueCentsProxy)}`}
                />
                <MetricCard
                  label="Conversion rate"
                  value={`${(data.coreMetrics.conversionRate * 100).toFixed(1)}%`}
                  hint="Territory.metrics.conversionRate"
                />
              </dl>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Supply vs demand</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-[#D4AF37]/15 bg-black/35 p-4">
                  <p className={`text-[11px] uppercase ${autonomyMuted}`}>Listings supply</p>
                  <p className="mt-2 text-2xl font-semibold">{data.supplyDemand.listingsSupply}</p>
                </div>
                <div className="rounded-xl border border-[#D4AF37]/15 bg-black/35 p-4">
                  <p className={`text-[11px] uppercase ${autonomyMuted}`}>Buyer demand</p>
                  <p className="mt-2 text-2xl font-semibold">{data.supplyDemand.buyerDemand}</p>
                  <p className={`mt-1 text-xs ${autonomyMuted}`}>Renter demand: {data.supplyDemand.renterDemand}</p>
                </div>
                <div className={`rounded-xl border p-4 ${highlightSupply?.className ?? ""}`}>
                  <p className={`text-[11px] uppercase opacity-80`}>Gap indicator</p>
                  <p className="mt-2 text-lg font-semibold leading-snug">{highlightSupply?.text}</p>
                  <p className={`mt-2 text-xs opacity-90`}>Ratio {data.supplyDemand.ratio.toFixed(2)} · {data.supplyDemand.gapSummary}</p>
                </div>
              </div>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Hub performance</h2>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>Penetration bands vs territory.metrics — gaps drive recruiting and routing.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className={`border-b ${autonomyMuted} border-[#D4AF37]/15 text-[11px] uppercase tracking-wide`}>
                      <th className="py-2 pr-4 font-medium">Hub</th>
                      <th className="py-2 pr-4 font-medium">Activity</th>
                      <th className="py-2 pr-4 font-medium">Score</th>
                      <th className="py-2 font-medium">Growth / gaps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hubPerformance.map((row) => (
                      <tr key={row.hub} className="border-b border-[#D4AF37]/10">
                        <td className="py-3 pr-4 font-medium text-[#f4efe4]">{row.label}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-md border border-[#D4AF37]/25 bg-black/40 px-2 py-0.5 text-xs">
                            {row.activityBand}
                          </span>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{row.activityScore}</td>
                        <td className="py-3 text-xs text-[#c9c4b8]">
                          <p>{row.growthNote}</p>
                          <p className="mt-1 text-[#D4AF37]/90">{row.gapNote}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Deal intelligence</h2>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>{data.dealIntelligence.quickActionNote}</p>
              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                <DealColumn title="Priority" deals={data.dealIntelligence.priorityDeals} />
                <DealColumn title="Stalled (21d+)" deals={data.dealIntelligence.stalledDeals} tone="amber" />
                <DealColumn title="High probability" deals={data.dealIntelligence.highProbabilityDeals} tone="emerald" />
              </div>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Marketing</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Active campaigns (MTD)"
                  value={data.marketing.activeCampaignsMtd === null ? "—" : String(data.marketing.activeCampaignsMtd)}
                  hint="marketingCampaign.updatedAt window"
                />
                <MetricCard
                  label="Content / SEO drafts"
                  value={data.marketing.contentPosted === null ? "—" : String(data.marketing.contentPosted)}
                  hint="seoPageDraft count"
                />
                <MetricCard
                  label="BNHub growth campaigns"
                  value={data.marketing.bnhubGrowthCampaigns === null ? "—" : String(data.marketing.bnhubGrowthCampaigns)}
                  hint="bnhubGrowthCampaign table"
                />
                <MetricCard
                  label="Engagement index"
                  value={data.marketing.engagementIndex === null ? "—" : String(data.marketing.engagementIndex)}
                  hint={data.marketing.engagementNote ?? "—"}
                />
              </dl>
              <div className="mt-6">
                <p className={`text-[11px] uppercase tracking-wide ${autonomyMuted}`}>Lead sources (7d, CRM)</p>
                <div className="mt-2 overflow-x-auto rounded-xl border border-[#D4AF37]/12 bg-black/35">
                  <table className="w-full min-w-[280px] text-left text-sm">
                    <thead>
                      <tr className={`border-b border-[#D4AF37]/15 text-[11px] uppercase ${autonomyMuted}`}>
                        <th className="px-3 py-2 font-medium">Source</th>
                        <th className="px-3 py-2 font-medium tabular-nums">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.marketing.topLeadSourcesWeek ?? []).length === 0 ?
                        <tr>
                          <td className={`px-3 py-3 text-xs ${autonomyMuted}`} colSpan={2}>
                            No CRM lead-source breakdown (empty week or query failed).
                          </td>
                        </tr>
                      : (data.marketing.topLeadSourcesWeek ?? []).map((row) => (
                          <tr key={row.source} className="border-b border-[#D4AF37]/10">
                            <td className="px-3 py-2 text-[#e8dfd0]">{row.source}</td>
                            <td className="px-3 py-2 tabular-nums text-[#f4efe4]">{row.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className={`mt-4 text-xs ${autonomyMuted}`}>{data.marketing.leadSourcesNote}</p>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Blockers</h2>
              <ul className="mt-4 space-y-3">
                {data.blockers.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-xl border border-[#D4AF37]/15 bg-black/40 px-4 py-3 text-sm leading-relaxed"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${severityDot(b.severity)}`} aria-hidden />
                      <span className="font-semibold text-[#f4efe4]">{b.title}</span>
                      <span className={`text-[10px] uppercase tracking-wide ${autonomyMuted}`}>{b.severity}</span>
                      <span className={`text-[10px] ${autonomyMuted}`}>· {b.source}</span>
                    </div>
                    <p className={`mt-2 text-xs ${autonomyMuted}`}>{b.reason}</p>
                    <p className="mt-2 text-xs text-[#D4AF37]/90">Fix: {b.suggestedFix}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Next best actions</h2>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>Prioritized from gaps + expansion draft + bench heuristics.</p>
              <ol className="mt-4 space-y-3">
                {data.nextActions.map((a, idx) => (
                  <li
                    key={a.id}
                    className="flex gap-3 rounded-xl border border-[#D4AF37]/12 bg-black/35 px-4 py-3 text-sm"
                  >
                    <span className="font-mono text-xs text-[#c9b667]">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-[#f4efe4]">{a.title}</p>
                      <p className={`mt-1 text-xs ${autonomyMuted}`}>{a.rationale}</p>
                      <p className="mt-1 text-[11px] text-[#9a958a]">
                        Basis: {a.dataBasis} · priority {a.priority}
                      </p>
                      {a.href ?
                        <Link
                          href={a.href}
                          className="mt-2 inline-flex text-xs font-medium text-[#D4AF37] hover:underline"
                        >
                          Open workspace →
                        </Link>
                      : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Expansion control</h2>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>
                Overrides persist for this territory. Link out for full self-expansion narrative and allocator checks.
              </p>
              {data.expansion ?
                <div className="mt-4 rounded-xl border border-[#D4AF37]/15 bg-black/35 p-4 text-sm leading-relaxed">
                  <p className="font-semibold text-[#f4efe4]">{data.expansion.title}</p>
                  <p className={`mt-2 text-xs ${autonomyMuted}`}>{data.expansion.summary}</p>
                  <p className={`mt-2 text-xs ${autonomyMuted}`}>Entry hub: {data.expansion.entryHub}</p>
                  <p className={`mt-2 text-xs ${autonomyMuted}`}>{data.expansion.phasedPlanSummary}</p>
                  <Link
                    href={data.expansion.linkSelfExpansion}
                    className="mt-3 inline-flex text-sm text-[#D4AF37] hover:underline"
                  >
                    Open self-expansion workspace →
                  </Link>
                </div>
              : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className={`block text-xs uppercase tracking-wide ${autonomyMuted}`}>
                  Phase override
                  <select
                    className="mt-2 w-full rounded-lg border border-[#D4AF37]/25 bg-black/60 px-3 py-2 text-sm text-[#f4efe4]"
                    value={phaseOverride}
                    onChange={(e) => setPhaseOverride(e.target.value)}
                  >
                    <option value="">Use derived phase (clear override)</option>
                    <option value="DISCOVERY">DISCOVERY</option>
                    <option value="LAUNCH">LAUNCH</option>
                    <option value="EXPAND">EXPAND</option>
                    <option value="DOMINATE">DOMINATE</option>
                  </select>
                </label>
                <div className="flex flex-col gap-3">
                  <label className={`flex cursor-pointer items-center gap-2 text-sm ${autonomyMuted}`}>
                    <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} className="accent-[#D4AF37]" />
                    Pause territory (operational halt flag)
                  </label>
                  <label className={`flex cursor-pointer items-center gap-2 text-sm ${autonomyMuted}`}>
                    <input
                      type="checkbox"
                      checked={scaling}
                      onChange={(e) => setScaling(e.target.checked)}
                      className="accent-[#D4AF37]"
                    />
                    Mark as scaling
                  </label>
                </div>
              </div>
              <label className={`mt-4 block text-xs uppercase tracking-wide ${autonomyMuted}`}>
                Expansion plan note
                <textarea
                  className="mt-2 min-h-[88px] w-full rounded-lg border border-[#D4AF37]/25 bg-black/60 px-3 py-2 text-sm text-[#f4efe4]"
                  value={planNote}
                  onChange={(e) => setPlanNote(e.target.value)}
                  placeholder="Operator notes — visible to audit trail."
                />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void onSaveOps()}
                  disabled={saving}
                  className="rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2 text-sm font-medium text-[#f4efe4] hover:bg-[#D4AF37]/25 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save expansion controls"}
                </button>
                {saveMsg ?
                  <span className={`text-xs ${saveMsg === "Saved." ? "text-emerald-300" : "text-amber-200"}`}>{saveMsg}</span>
                : null}
              </div>
              <p className={`mt-4 text-xs ${autonomyMuted}`}>{data.capitalAllocatorNote}</p>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Map view</h2>
              <p className={`mt-2 text-sm ${autonomyMuted}`}>
                {data.map.enabled ? "Map enabled." : data.map.message}
              </p>
              {!data.map.enabled ?
                <ul className={`mt-3 list-disc space-y-1 pl-5 text-xs ${autonomyMuted}`}>
                  <li>Listings distribution heatmap</li>
                  <li>Demand hotspots (buyer / renter intent proxies)</li>
                  <li>Broker density vs bench targets</li>
                </ul>
              : null}
            </section>

            <footer className={`${autonomyGlassCard} space-y-2 p-5`}>
              <p className={`text-[11px] uppercase tracking-[0.2em] ${autonomyMuted}`}>Integration & disclaimers</p>
              <ul className={`list-disc space-y-1 pl-5 text-xs ${autonomyMuted}`}>
                {data.disclaimers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="text-[10px] text-[#7a756c]">
                Generated {new Date(data.generatedAt).toLocaleString()} · Wiring: self-expansion, deal intelligence,
                marketing tables, booking counts, capital allocator note.
              </p>
            </footer>
          </>
        : null}
      </div>
    </div>
  );
}

function MetricCard(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/12 bg-black/35 px-4 py-3">
      <p className={`text-[11px] uppercase tracking-wide ${autonomyMuted}`}>{props.label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#f4efe4]">{props.value}</p>
      <p className={`mt-2 text-[10px] leading-snug text-[#7a756c]`}>{props.hint}</p>
    </div>
  );
}

function DealColumn(props: {
  title: string;
  deals: Payload["dealIntelligence"]["priorityDeals"];
  tone?: "amber" | "emerald";
}) {
  const border =
    props.tone === "amber" ? "border-amber-500/25"
    : props.tone === "emerald" ? "border-emerald-500/25"
    : "border-[#D4AF37]/15";
  return (
    <div className={`rounded-xl border ${border} bg-black/30 p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-wide text-[#c9b667]`}>{props.title}</p>
      <ul className="mt-3 space-y-2">
        {props.deals.length === 0 ?
          <li className={`text-xs ${autonomyMuted}`}>None in this slice.</li>
        : props.deals.map((d) => (
            <li key={d.id} className="rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-xs">
              <Link href={`/dashboard/deals/${d.id}`} className="font-medium text-[#D4AF37] hover:underline">
                {d.dealCode ?? d.id.slice(0, 8)}
              </Link>
              <p className={`mt-1 ${autonomyMuted}`}>
                {d.status} · {d.crmStage ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/deals/${d.id}`}
                  className="rounded border border-[#D4AF37]/30 px-2 py-0.5 text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Open deal
                </Link>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
}

function formatMoney(cents: number) {
  if (!Number.isFinite(cents)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
