"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BrokerPipelineSummary, BrokerProspect, BrokerStage } from "@/modules/brokers/broker-pipeline.types";
import type { BrokerOutreachScripts } from "@/modules/brokers/broker-outreach.service";
import type { BrokerOutreachScriptMeta } from "@/modules/brokers/broker-outreach.service";
import type { BrokerLeadPreviewPayload } from "@/modules/brokers/broker-lead-preview.service";
import { BrokerLeadPreview } from "@/components/brokers/BrokerLeadPreview";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { BrokerQuickAddForm } from "@/components/brokers/BrokerQuickAddForm";
import { exportProspectsAsCsv, exportProspectsAsJson } from "@/modules/brokers/broker-pipeline-export";

const STAGES: BrokerStage[] = ["new", "contacted", "replied", "demo", "converted", "lost"];

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text).catch(() => {
    window.alert("Could not copy.");
  });
}

function personalize(body: string, prospectName: string): string {
  const first = prospectName.trim().split(/\s+/)[0] ?? prospectName;
  return body.replace(/\[Name\]/g, first);
}

function leadUnlockConversionPercent(p: BrokerProspect): number {
  const leads = Math.max(0, p.leadsReceived ?? 0);
  const unlocked = Math.max(0, p.leadsUnlocked ?? 0);
  return leads > 0 ? Math.round((unlocked / leads) * 1000) / 10 : 0;
}

type BrokerInsightsPayload = {
  bestTerritory: { region: string; revenueCad: number } | null;
  topBrokerProspect: { id: string; name: string; revenueCad: number } | null;
  highestRevenueSource: { label: string; amountCad: number } | null;
};

type RevenueSnapshotPayload = {
  revenueTodayCad: number;
  revenueYesterdayCad: number;
  revenueFromLeadsCad: number;
  revenueFromFeaturedCad: number;
  revenuePerBroker: { userId: string; email: string | null; amountCad: number }[];
  revenueByDay: { day: string; totalCad: number }[];
} | null;

type FollowUpSuggestion = {
  prospectId: string;
  reason: string;
  suggestedMessage: string;
};

type PriorityTarget = {
  prospect: BrokerProspect;
  bucket: "high_potential" | "inactive_high_value";
  score: number;
};

type ApiPayload = {
  prospects: BrokerProspect[];
  persistence?: {
    jsonPathConfigured: boolean;
    persistenceMode: "memory" | "json_file";
  };
  summary: BrokerPipelineSummary | null;
  dailyActions: string[];
  monitoring: {
    prospectsAdded: number;
    stageChanges: number;
    notesAdded: number;
    scriptsCopied: number;
    conversionsMarked: number;
    lostDeals: number;
    conversionAttempts: number;
    missingDataWarnings: number;
    conversions: number;
  };
  scripts: BrokerOutreachScripts | null;
  scriptList: BrokerOutreachScriptMeta[];
  leadPreview: BrokerLeadPreviewPayload | null;
  monetizationConfig?: { brokerLeadPriceCad: number; freeLeadQuota: number };
  featuredViewUpliftPercent?: number | null;
  topBrokers?: BrokerProspect[];
  leadAssignments?: { leadId: string; unlocked: boolean }[];
  followUpSuggestions?: FollowUpSuggestion[];
  brokerScores?: { id: string; score: number }[];
  priorityTargets?: PriorityTarget[];
  insights?: BrokerInsightsPayload | null;
  alerts?: string[];
  revenueSnapshot?: RevenueSnapshotPayload;
};

export function BrokerPipelineDashboard() {
  const conversionEngineFlags = useConversionEngineFlags();
  const [data, setData] = useState<ApiPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broker-pipeline-v1", { credentials: "same-origin" });
      const j = (await res.json()) as ApiPayload & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData({
        prospects: j.prospects ?? [],
        persistence: j.persistence,
        summary: j.summary ?? null,
        dailyActions: j.dailyActions ?? [],
        monitoring: j.monitoring ?? {
          prospectsAdded: 0,
          stageChanges: 0,
          notesAdded: 0,
          scriptsCopied: 0,
          conversionsMarked: 0,
          lostDeals: 0,
          conversionAttempts: 0,
          missingDataWarnings: 0,
          conversions: 0,
        },
        scripts: j.scripts ?? null,
        scriptList: j.scriptList ?? [],
        leadPreview: j.leadPreview ?? null,
        monetizationConfig: j.monetizationConfig,
        featuredViewUpliftPercent: j.featuredViewUpliftPercent,
        topBrokers: j.topBrokers,
        leadAssignments: j.leadAssignments,
        followUpSuggestions: j.followUpSuggestions,
        brokerScores: j.brokerScores,
        priorityTargets: j.priorityTargets,
        insights: j.insights ?? null,
        alerts: j.alerts,
        revenueSnapshot: j.revenueSnapshot ?? null,
      });
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prospects = data?.prospects ?? [];

  const byStage = useMemo(() => {
    const m = new Map<BrokerStage, BrokerProspect[]>();
    for (const s of STAGES) m.set(s, []);
    for (const p of prospects) {
      const list = m.get(p.stage);
      if (list) list.push(p);
    }
    return m;
  }, [prospects]);

  const summary = data?.summary;

  const moveStage = async (id: string, stage: BrokerStage) => {
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stage", id, stage }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      window.alert((j as { error?: string }).error ?? "Update failed");
      return;
    }
    await load();
  };

  const addNote = async (id: string) => {
    const note = window.prompt("Add a note (logged on prospect):");
    if (!note?.trim()) return;
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", id, note: note.trim() }),
    });
    if (!res.ok) {
      window.alert("Could not save note");
      return;
    }
    await load();
  };

  const copyScript = async (p: BrokerProspect, meta: BrokerOutreachScriptMeta) => {
    const text = personalize(meta.body, p.name);
    copyToClipboard(text);
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "script_copy", id: p.id, scriptKind: meta.id }),
    });
    if (!res.ok) window.alert("Copied, but could not update contact meta.");
    else await load();
  };

  const markDemoShown = async (p: BrokerProspect) => {
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo_shown", id: p.id, shown: true }),
    });
    if (!res.ok) window.alert("Could not update");
    else await load();
  };

  const markPurchase = async (p: BrokerProspect) => {
    const amount = window.prompt("Total spent (CAD dollars, optional), e.g. 49", String(p.totalSpent ?? ""));
    if (amount === null) return;
    const totalSpent = amount.trim() === "" ? undefined : Number.parseFloat(amount);
    if (amount.trim() !== "" && !Number.isFinite(totalSpent)) {
      window.alert("Invalid number");
      return;
    }
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "mark_purchase",
        id: p.id,
        firstPurchaseDate: new Date().toISOString().slice(0, 10),
        totalSpent,
      }),
    });
    if (!res.ok) window.alert("Could not mark purchase");
    else await load();
  };

  const patchOperatorMeta = async (p: BrokerProspect) => {
    const territory = window.prompt(
      "Territory / city for lead routing (saved on prospect)",
      p.territoryRegion ?? "",
    );
    if (territory === null) return;
    const rawTags = window.prompt(
      "Operator tags: comma-separated paying, active, high_value (empty to clear). Cancel to leave tags unchanged.",
      (p.operatorTags ?? []).join(","),
    );
    const operatorTags =
      rawTags === null
        ? undefined
        : rawTags.trim() === ""
          ? []
          : rawTags
              .split(",")
              .map((s) => s.trim())
              .filter((s): s is "paying" | "active" | "high_value" => s === "paying" || s === "active" || s === "high_value");
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "operator_meta",
        id: p.id,
        territoryRegion: territory.trim() || undefined,
        ...(operatorTags !== undefined ? { operatorTags } : {}),
      }),
    });
    if (!res.ok) window.alert("Could not save meta");
    else await load();
  };

  const routeCrmLead = async () => {
    const leadId = window.prompt("Paste CRM Lead ID to assign into pipeline routing");
    if (!leadId?.trim()) return;
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "route_crm_lead", leadId: leadId.trim() }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert((j as { error?: string }).error ?? "Assign failed");
      return;
    }
    window.alert(
      `Assigned to prospect row ${(j as { assignment?: { brokerProspectId?: string } }).assignment?.brokerProspectId ?? "?"}`,
    );
    await load();
  };

  const addClosedDealMetric = async (p: BrokerProspect) => {
    const deals = window.prompt("Add to closed deals count", "1");
    if (deals === null) return;
    const n = Number.parseInt(deals, 10);
    if (!Number.isFinite(n) || n < 1) {
      window.alert("Enter a positive integer");
      return;
    }
    const revRaw = window.prompt("Attributed revenue (CAD, optional)", "0");
    if (revRaw === null) return;
    const revenueCadDelta = revRaw.trim() === "" ? 0 : Number.parseFloat(revRaw);
    if (!Number.isFinite(revenueCadDelta) || revenueCadDelta < 0) {
      window.alert("Invalid revenue");
      return;
    }
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "conversion_metric",
        id: p.id,
        closedDealsDelta: n,
        revenueCadDelta,
      }),
    });
    if (!res.ok) window.alert("Could not update metrics");
    else await load();
  };

  const scoreById = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of data?.brokerScores ?? []) m.set(row.id, row.score);
    return m;
  }, [data?.brokerScores]);

  const downloadExport = useCallback((kind: "json" | "csv") => {
    const list = data?.prospects ?? [];
    const stamp = new Date().toISOString().slice(0, 10);
    const body = kind === "json" ? exportProspectsAsJson(list) : exportProspectsAsCsv(list);
    const mime = kind === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
    const ext = kind === "json" ? "json" : "csv";
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `broker-pipeline-v1-export-${stamp}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data?.prospects]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading pipeline…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  const daily = data?.dailyActions ?? [];
  const mon = data?.monitoring;
  const scriptList = data?.scriptList ?? [];

  const persist = data?.persistence;
  const persistenceBanner =
    persist?.persistenceMode === "json_file" && persist.jsonPathConfigured ? (
      <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
        <strong className="text-emerald-200">Persistent JSON storage enabled</strong>
        <span className="text-emerald-100/90">
          {" "}
          — <code className="rounded bg-black/30 px-1 text-xs">BROKER_PIPELINE_JSON_PATH</code> is set; prospects survive
          process restarts when the path is writable.
        </span>
      </div>
    ) : (
      <div className="rounded-xl border border-amber-700/50 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
        <strong className="text-amber-200">In-memory only (data may reset)</strong>
        <span className="text-amber-100/90">
          {" "}
          — set <code className="rounded bg-black/30 px-1 text-xs">BROKER_PIPELINE_JSON_PATH</code> to a writable file for
          durable JSON snapshots across deploys/restarts.
        </span>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
        <p className="font-semibold text-white">V1 operator broker pipeline</p>
        <p className="mt-1 text-xs text-slate-400">
          Stage board + scripts + monitoring — separate from the legacy Prisma CRM. For DB-backed first-10 prospects
          only, use{" "}
          <a href="/admin/broker-acquisition-legacy" className="text-emerald-400 hover:underline">
            /admin/broker-acquisition-legacy
          </a>
          .
        </p>
      </div>

      {persistenceBanner}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Operator checklist</p>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-slate-300">
          <li>Add brokers (quick add or CRM assign)</li>
          <li>Copy first outreach script and send</li>
          <li>Follow up (notes + follow-up script)</li>
          <li>Mark demo shown when preview is delivered</li>
          <li>Mark purchase when they pay</li>
          <li>Review monitoring + revenue snapshot below</li>
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Export prospects</span>
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={() => downloadExport("json")}
        >
          Download JSON
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={() => downloadExport("csv")}
        >
          Download CSV
        </button>
        <span className="text-[11px] text-slate-500">Includes stage, notes count, last contact, purchase fields.</span>
      </div>

      {(data?.alerts?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-rose-700/40 bg-rose-950/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-200">Alerts</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-100/90">
            {(data?.alerts ?? []).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Monetization & revenue (CRM unlocks use live Stripe + RevenueEvent)
        </p>
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Reference lead price (CAD)</p>
            <p className="font-semibold text-white">{data?.monetizationConfig?.brokerLeadPriceCad ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Free lead quota (onboarding narrative)</p>
            <p className="font-semibold text-white">{data?.monetizationConfig?.freeLeadQuota ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Today revenue (CAD)</p>
            <p className="font-semibold text-emerald-300">{data?.revenueSnapshot?.revenueTodayCad ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Yesterday revenue (CAD)</p>
            <p className="font-semibold text-slate-200">{data?.revenueSnapshot?.revenueYesterdayCad ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">30d lead unlock revenue</p>
            <p className="font-semibold text-white">{data?.revenueSnapshot?.revenueFromLeadsCad ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">30d featured / boost revenue</p>
            <p className="font-semibold text-white">{data?.revenueSnapshot?.revenueFromFeaturedCad ?? "—"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {typeof data?.featuredViewUpliftPercent === "number" ? (
            <>
              Featured listings in search: cohort shows ~{data.featuredViewUpliftPercent}% more views vs non-featured.
            </>
          ) : (
            <>
              Featured uplift: set <code className="text-slate-400">BROKER_FEATURED_VIEW_UPLIFT_PERCENT</code> when you
              have measured cohort data — we do not guess a percentage.
            </>
          )}
        </p>
        {(data?.revenueSnapshot?.revenuePerBroker?.length ?? 0) > 0 ? (
          <p className="mt-2 text-[11px] text-slate-500">
            Top broker accounts by 30d revenue (DB):{" "}
            {(data?.revenueSnapshot?.revenuePerBroker ?? [])
              .slice(0, 4)
              .map((r) => `${r.email ?? r.userId}: $${r.amountCad.toFixed(2)}`)
              .join(" · ")}
          </p>
        ) : null}
      </section>

      {data?.insights ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Insights</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>
              Best territory (pipeline revenue):{" "}
              {data.insights.bestTerritory
                ? `${data.insights.bestTerritory.region} ($${data.insights.bestTerritory.revenueCad} CAD attributed)`
                : "—"}
            </li>
            <li>
              Top prospect by revenue:{" "}
              {data.insights.topBrokerProspect
                ? `${data.insights.topBrokerProspect.name} ($${data.insights.topBrokerProspect.revenueCad})`
                : "—"}
            </li>
            <li>
              Highest revenue source (30d DB):{" "}
              {data.insights.highestRevenueSource
                ? `${data.insights.highestRevenueSource.label} ($${data.insights.highestRevenueSource.amountCad})`
                : "—"}
            </li>
          </ul>
        </section>
      ) : null}

      {(data?.priorityTargets?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-violet-800/60 bg-violet-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-200">Priority targets</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(data?.priorityTargets ?? []).map((t) => (
              <li
                key={t.prospect.id}
                className="rounded-lg border border-violet-800/80 bg-black/30 px-2 py-1 text-[11px] text-violet-100"
              >
                <span className="font-semibold text-white">{t.prospect.name}</span>
                <span className="text-violet-300">
                  {" "}
                  · {t.bucket.replace("_", " ")} · score {t.score}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={() => void routeCrmLead()}
        >
          Assign CRM lead
        </button>
      </div>

      {(data?.followUpSuggestions?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-sky-800/50 bg-sky-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">Suggested follow-ups</p>
          <ul className="mt-3 space-y-3">
            {(data?.followUpSuggestions ?? []).map((s) => (
              <li key={s.prospectId} className="rounded-lg border border-sky-900/80 bg-black/25 p-3 text-sm">
                <p className="text-[11px] text-sky-300/90">{s.reason}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-200">{s.suggestedMessage}</p>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-semibold text-emerald-400 hover:underline"
                  onClick={() => copyToClipboard(s.suggestedMessage)}
                >
                  Copy message
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(data?.topBrokers?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Top brokers (pipeline store)</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
                  <th className="py-2 pr-2">Broker</th>
                  <th className="py-2 pr-2">Listings</th>
                  <th className="py-2 pr-2">Leads recv</th>
                  <th className="py-2 pr-2">Unlock %</th>
                  <th className="py-2">Revenue CAD</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topBrokers ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-slate-800/80">
                    <td className="py-2 pr-2 font-medium text-white">{b.name}</td>
                    <td className="py-2 pr-2">{b.listingsCount ?? 0}</td>
                    <td className="py-2 pr-2">{b.leadsReceived ?? 0}</td>
                    <td className="py-2 pr-2">{leadUnlockConversionPercent(b)}%</td>
                    <td className="py-2">${(b.revenueGenerated ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {daily.length > 0 ? (
        <section className="rounded-xl border border-premium-gold/30 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Today&apos;s actions</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-100/90">
            {daily.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary ? (
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Total</p>
            <p className="text-lg font-semibold text-white">{summary.total}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Contacted</p>
            <p className="text-lg font-semibold text-white">{summary.byStage.contacted}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Replied</p>
            <p className="text-lg font-semibold text-white">{summary.byStage.replied}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Converted</p>
            <p className="text-lg font-semibold text-emerald-300">{summary.byStage.converted}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Conversion rate</p>
            <p className="text-lg font-semibold text-white">{summary.conversionRate}%</p>
          </div>
        </div>
      ) : null}

      {mon ? (
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Added: {mon.prospectsAdded}</span>
          <span>Stage moves: {mon.stageChanges}</span>
          <span>Notes: {mon.notesAdded}</span>
          <span>Scripts copied: {mon.scriptsCopied}</span>
          <span>Converted: {mon.conversionsMarked}</span>
          <span>Lost: {mon.lostDeals}</span>
          <span>Unlock attempts: {mon.conversionAttempts}</span>
          <span>Missing contact hints: {mon.missingDataWarnings}</span>
        </div>
      ) : null}

      <BrokerQuickAddForm onAdded={load} />

      <div className="grid gap-4 lg:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold capitalize text-premium-gold">{stage}</h3>
              <span className="text-[10px] text-slate-500">{(byStage.get(stage) ?? []).length}</span>
            </div>
            <ul className="mt-2 max-h-[min(480px,55vh)] space-y-2 overflow-y-auto">
              {(byStage.get(stage) ?? []).map((p) => (
                <li key={p.id} className="rounded-lg border border-slate-800/80 bg-black/30 p-2 text-xs text-slate-200">
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {[p.email, p.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {p.agency ? <p className="text-[11px] text-slate-500">{p.agency}</p> : null}
                  <p className="text-[10px] text-slate-500">
                    {p.source ? `${p.source} · ` : ""}
                    notes {p.notes?.length ?? 0} · created {p.createdAt.slice(0, 10)} · upd {p.updatedAt.slice(0, 10)}
                  </p>
                  {p.lastContactAt ? (
                    <p className="text-[10px] text-slate-600">Last outreach: {p.lastContactAt.slice(0, 16)}</p>
                  ) : null}
                  {p.demoLeadPreviewShown ? (
                    <p className="text-[10px] text-amber-200/90">Demo lead preview shown</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-slate-500">
                    Listings {p.listingsCount ?? 0} · Leads {p.leadsReceived ?? 0} · Unlock {leadUnlockConversionPercent(p)}
                    % · Rev ${(p.revenueGenerated ?? 0).toFixed(0)}
                    {scoreById.has(p.id) ? ` · Score ${scoreById.get(p.id)}` : ""}
                  </p>
                  {p.territoryRegion ? (
                    <p className="text-[10px] text-slate-600">Territory: {p.territoryRegion}</p>
                  ) : null}
                  {(p.operatorTags?.length ?? 0) > 0 ? (
                    <p className="text-[10px] text-emerald-400/90">Tags: {(p.operatorTags ?? []).join(", ")}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <select
                      aria-label={`Move ${p.name}`}
                      className="max-w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px] text-white"
                      value={p.stage}
                      onChange={(e) => void moveStage(p.id, e.target.value as BrokerStage)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          → {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void addNote(p.id)}
                    >
                      Note
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void markDemoShown(p)}
                    >
                      Mark demo shown
                    </button>
                    <button
                      type="button"
                      className="rounded border border-emerald-700 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-slate-800"
                      onClick={() => void markPurchase(p)}
                    >
                      Mark purchase
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void patchOperatorMeta(p)}
                    >
                      Territory / tags
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void addClosedDealMetric(p)}
                    >
                      Add closed deal
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-800/80 pt-2">
                    {scriptList.map((meta) => (
                      <button
                        key={meta.id}
                        type="button"
                        className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400 hover:bg-slate-800"
                        onClick={() => void copyScript(p, meta)}
                      >
                        Copy {meta.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <BrokerLeadPreview
        conversionBoost={conversionEngineFlags.conversionUpgradeV1}
        leadPreviewPayload={data?.leadPreview ?? undefined}
      />

      {scriptList.length > 0 ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Outreach scripts (global)</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {scriptList.map((meta) => (
              <div key={meta.id} className="rounded-lg border border-slate-800 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">{meta.label}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{meta.body}</p>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-semibold text-emerald-400 hover:underline"
                  onClick={() => copyToClipboard(meta.body)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
