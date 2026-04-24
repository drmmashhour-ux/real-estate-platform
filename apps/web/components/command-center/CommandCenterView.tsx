"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

import type { CommandCenterPagePayload } from "@/modules/command-center/command-center.types";
import { visibleSectionsForRole } from "@/modules/command-center/command-center-visibility";
import { dealNextActionHint } from "@/modules/command-center/command-center-deal-hints";
import type { IntelligenceFeedItem } from "@/modules/command-center/signal.types";

import { cc } from "@/components/command-center/cc-tokens";
import { CcStatusBadge } from "@/components/command-center/CcStatusBadge";
import { SignalCard } from "@/components/command-center/SignalCard";

const MarketingExpansionPanel = dynamic(
  () => import("@/components/command-center/MarketingExpansionPanel").then((m) => m.MarketingExpansionPanel),
  { loading: () => <PanelSkeleton title="Marketing & expansion" /> },
);

function PanelSkeleton(props: { title: string }) {
  return (
    <div className={`${cc.cardMuted} animate-pulse`}>
      <p className="text-xs text-neutral-600">{props.title}</p>
      <div className="mt-4 h-24 rounded-lg bg-neutral-800/60" />
    </div>
  );
}

function Icon(props: { name: IntelligenceFeedItem["icon"] }) {
  const cls = "h-4 w-4 shrink-0 text-[#D4AF37]/90";
  switch (props.name) {
    case "calendar":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "user":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 12h.01" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "alert":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3l-6.93-12a2 2 0 00-3.48 0l-6.93 12a2 2 0 001.74 3z" />
        </svg>
      );
    case "spark":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "chart":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 4 4 5-7M16 21H8a2 2 0 01-2-2V5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export function CommandCenterView(props: { initial: CommandCenterPagePayload }) {
  const { initial } = props;
  const sections = useMemo(() => visibleSectionsForRole(initial.role), [initial.role]);
  const [drawer, setDrawer] = useState<{ title: string; body: string } | null>(null);

  const ex = initial.summary.executive;
  const primaryIds = useMemo(() => new Set(initial.signalsPrimary.map((s) => s.id)), [initial.signalsPrimary]);

  const zoneRemainder = useMemo(() => {
    const cap = 3;
    return {
      critical: initial.signalsByZone.critical.filter((s) => !primaryIds.has(s.id)).slice(0, cap),
      attention: initial.signalsByZone.attention.filter((s) => !primaryIds.has(s.id)).slice(0, cap),
      healthy: initial.signalsByZone.healthy.filter((s) => !primaryIds.has(s.id)).slice(0, cap),
    };
  }, [initial.signalsByZone, primaryIds]);

  const mobileTopSignals = useMemo(() => {
    const pool = [...initial.signalsByZone.critical, ...initial.signalsByZone.attention, ...initial.signalsPrimary];
    const seen = new Set<string>();
    const out: typeof initial.signalsPrimary = [];
    for (const s of pool) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
      if (out.length >= 4) break;
    }
    return out;
  }, [initial.signalsByZone, initial.signalsPrimary]);

  return (
    <div className={`${cc.page}`}>
      <header className="mb-8 flex flex-col gap-4 border-b border-[#1f1f1f] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/85">
            {initial.viewMode === "executive" ? "Executive command" : "Broker command"}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#f4efe4]">Operations overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Intelligence-first command center — every signal includes provenance, explanation, and governed actions.
          </p>
        </div>
        <p className="text-xs text-neutral-600">
          Refreshed{" "}
          <time dateTime={initial.generatedAt}>{new Date(initial.generatedAt).toLocaleString()}</time>
        </p>
      </header>

      {sections.executiveSummary ?
        <section className="mb-10 space-y-4" aria-labelledby="exec-summary">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="exec-summary" className={cc.sectionTitle}>
              Executive signals
            </h2>
            <CcStatusBadge lane={ex.automationTrend} label={ex.automationDisplay} />
          </div>
          <p className="text-xs text-neutral-500">
            Top {initial.signalsPrimary.length} prioritized signals — sorted by severity, impact, and recency.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {initial.signalsPrimary.map((s) => (
              <SignalCard key={s.id} signal={s} compact />
            ))}
          </div>
          <p className="text-xs text-neutral-600">{initial.summary.revenueGrowthHint}</p>
        </section>
      : null}

      <section className="mb-10" aria-labelledby="priority-zones">
        <h2 id="priority-zones" className={`${cc.sectionTitle} mb-4`}>
          Priority zones
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PriorityZoneColumn
            title="Critical — act now"
            hint="Blocking or high-regret exposure"
            signals={zoneRemainder.critical}
            empty="No additional critical signals beyond the executive strip."
            tone="critical"
          />
          <PriorityZoneColumn
            title="Attention — review"
            hint="Review within the working day"
            signals={zoneRemainder.attention}
            empty="Attention queue clear for overflow signals."
            tone="attention"
          />
          <PriorityZoneColumn
            title="Healthy — monitor"
            hint="Maintain cadence"
            signals={zoneRemainder.healthy}
            empty="No overflow healthy-band items."
            tone="healthy"
          />
        </div>
      </section>

      <QuickActionsBar viewMode={initial.viewMode} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          {sections.revenueGrowth ?
            <section aria-labelledby="rev-growth">
              <h2 id="rev-growth" className={`${cc.sectionTitle} mb-4`}>
                Revenue + growth
              </h2>
              <div className={`${cc.card}`}>
                <p className="text-sm text-neutral-400">
                  Growth signals are folded into executive cards above. Deep links remain for channel tuning and
                  experiments.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/dashboard/growth" className={cc.linkSubtle}>
                    Growth Machine →
                  </Link>
                  <Link href="/dashboard/admin/marketing-ai/daily" className={cc.linkSubtle}>
                    Marketing AI →
                  </Link>
                </div>
              </div>
            </section>
          : null}

          {sections.dealsPipeline ?
            <section aria-labelledby="deals">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="deals" className={cc.sectionTitle}>
                  Deal intelligence
                </h2>
                <Link href="/dashboard/lecipm/deals" className={cc.linkSubtle}>
                  View all deals
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DealList
                  title="Top closing opportunities"
                  rows={initial.summary.priorityDeals}
                  empty="No active deals surfaced."
                  nextActionLabel="Next best action"
                />
                <DealList
                  title="Stalled — needs momentum"
                  rows={initial.summary.stalledDeals}
                  empty="No stalled deals detected."
                  muted
                  nextActionLabel="Recovery move"
                />
              </div>
            </section>
          : null}

          {sections.leadsConversion ?
            <section aria-labelledby="leads">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="leads" className={cc.sectionTitle}>
                  Leads + conversion
                </h2>
                <Link href="/dashboard/lecipm/leads" className={cc.linkSubtle}>
                  Open leads workspace
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <LeadList title="Hottest leads" rows={initial.summary.hotLeads} />
                <LeadList title="Follow-up needed" rows={initial.summary.followUpLeads} muted />
              </div>
            </section>
          : null}

          <StrategicRecommendationsSection rows={initial.strategicRecommendations} />

          {sections.trustRisk ?
            <section aria-labelledby="trust">
              <h2 id="trust" className={`${cc.sectionTitle} mb-4`}>
                Marketplace health
              </h2>
              <MarketplaceHealthPanel
                data={initial.marketplaceHealth}
                legacy={initial.summary.trustRisk}
                viewMode={initial.viewMode}
                onDetail={(t, b) => setDrawer({ title: t, body: b })}
              />
            </section>
          : null}

          {sections.marketingExpansion ?
            <section aria-labelledby="mkt">
              <h2 id="mkt" className={`${cc.sectionTitle} mb-4`}>
                Marketing + expansion
              </h2>
              <MarketingExpansionPanel data={initial.summary.marketing} />
            </section>
          : null}

          {sections.approvalsAlerts ?
            <section aria-labelledby="alerts">
              <h2 id="alerts" className={`${cc.sectionTitle} mb-4`}>
                Approvals + alerts
              </h2>
              <AlertsPanel rows={initial.alerts} onOpen={(r) => setDrawer({ title: r.title, body: `${r.kind} · ${r.createdAt}` })} />
            </section>
          : null}
        </div>

        {sections.liveFeed ?
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <h2 className={`${cc.sectionTitle}`}>Intelligence feed</h2>
            <IntelligenceFeedColumn items={initial.intelligenceFeed} />
            <div className={`${cc.cardMuted} xl:hidden`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Mobile glance</p>
              <ul className="mt-3 space-y-3">
                {mobileTopSignals.map((s) => (
                  <li key={s.id} className="border-b border-[#232323]/60 pb-2 last:border-0">
                    <p className="text-xs font-semibold text-[#f4efe4]">{s.title}</p>
                    <p className="text-[11px] text-neutral-500">{s.explanation.slice(0, 120)}…</p>
                    {s.recommendedActions[0]?.href ?
                      <Link href={s.recommendedActions[0].href} className={`${cc.linkSubtle} mt-1 inline-block text-[11px]`}>
                        Act →
                      </Link>
                    : null}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-neutral-600">
                Alerts: {initial.alerts.length} · Feed items: {initial.intelligenceFeed.length}
              </p>
            </div>
          </aside>
        : null}
      </div>

      {drawer ?
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal
          onClick={() => setDrawer(null)}
        >
          <div
            className="h-full w-full max-w-md border-l border-[#232323] bg-[#0c0c0c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="mb-4 text-xs text-neutral-500 hover:text-[#D4AF37]" onClick={() => setDrawer(null)}>
              Close
            </button>
            <h3 className="font-serif text-xl text-[#f4efe4]">{drawer.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">{drawer.body}</p>
            <p className="mt-6 text-xs text-neutral-600">
              Deep links open in context routes — drawers are quick orientation only. Approvals require documented
              rationale in the AI CEO queue.
            </p>
          </div>
        </div>
      : null}
    </div>
  );
}

function PriorityZoneColumn(props: {
  title: string;
  hint: string;
  signals: CommandCenterPagePayload["signals"];
  empty: string;
  tone: "critical" | "attention" | "healthy";
}) {
  const border =
    props.tone === "critical" ? "border-red-900/40"
    : props.tone === "attention" ? "border-[#D4AF37]/25"
    : "border-neutral-800";
  return (
    <div className={`${cc.cardMuted} border ${border}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{props.title}</p>
      <p className="mt-1 text-xs text-neutral-600">{props.hint}</p>
      <div className="mt-4 space-y-3">
        {props.signals.length === 0 ?
          <p className="text-sm text-neutral-600">{props.empty}</p>
        : props.signals.map((s) => (
            <SignalCard key={s.id} signal={s} compact />
          ))}
      </div>
    </div>
  );
}

function StrategicRecommendationsSection(props: {
  rows: CommandCenterPagePayload["strategicRecommendations"];
  show: boolean;
}) {
  if (!props.show || props.rows.length === 0) return null;
  return (
    <section aria-labelledby="strategic">
      <h2 id="strategic" className={`${cc.sectionTitle} mb-4`}>
        Strategic recommendations
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {props.rows.map((r) => (
          <div key={r.id} className={cc.card}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#f4efe4]">{r.title}</h3>
              {r.requiresApproval ?
                <span className="rounded-full border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#D4AF37]">
                  Requires approval
                </span>
              : null}
            </div>
            <p className="mt-3 text-sm text-neutral-400">{r.explanation}</p>
            <p className="mt-2 text-xs text-neutral-500">
              <span className="text-neutral-600">Expected impact:</span> {r.expectedImpact}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.actions.map((a) =>
                a.href ?
                  <Link
                    key={a.id}
                    href={a.href}
                    className="rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-200 hover:border-[#D4AF37]/40"
                  >
                    {a.label}
                  </Link>
                : null,
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketplaceHealthPanel(props: {
  data: CommandCenterPagePayload["marketplaceHealth"];
  legacy: CommandCenterPagePayload["summary"]["trustRisk"];
  onDetail: (title: string, body: string) => void;
}) {
  const { data, legacy } = props;
  const levelBadge =
    data.overallLevel === "urgent" ? "urgent"
    : data.overallLevel === "attention" ? "attention"
    : "healthy";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={cc.card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Marketplace health</h3>
          <CcStatusBadge lane={levelBadge} label={data.overallLevel} />
        </div>
        <p className="mt-3 text-sm text-neutral-300">{data.headline}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Trust</dt>
            <dd className={cc.metric}>{data.trustScore ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Band</dt>
            <dd className="text-neutral-200">{data.trustBand ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Dispute risk (snapshot)</dt>
            <dd className={cc.metric}>{data.disputeRiskScore != null ? Math.round(data.disputeRiskScore) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Open disputes</dt>
            <dd className={cc.metric}>{data.openDisputes}</dd>
          </div>
        </dl>
      </div>
      <div className={cc.card}>
        <h3 className="text-sm font-semibold text-white">Risks & leverage</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-red-300/90">Biggest risks</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-400">
              {data.biggestRisks.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Improvements</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-400">
              {data.biggestImprovements.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#232323] pt-4">
          {data.quickActions.map((a) =>
            a.href ?
              <Link key={a.id} href={a.href} className={cc.linkSubtle}>
                {a.label} →
              </Link>
            : null,
          )}
        </div>
        <button
          type="button"
          className="mt-4 text-left text-xs text-neutral-500 hover:text-[#D4AF37]"
          onClick={() => props.onDetail("Compliance notes", legacy.complianceNotes.join("\n") || "No extra notes.")}
        >
          Compliance brief →
        </button>
      </div>
    </div>
  );
}

function DealList(props: {
  title: string;
  rows: import("@/modules/command-center/command-center.types").CommandCenterDealRow[];
  empty: string;
  muted?: boolean;
  nextActionLabel: string;
}) {
  return (
    <div className={`${props.muted ? cc.cardMuted : cc.card}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#f0ebe0]">{props.title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {props.rows.length === 0 ?
          <li className="text-sm text-neutral-600">{props.empty}</li>
        : props.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#232323]/80 pb-3 last:border-0">
              <div>
                <p className="text-sm text-neutral-200">{r.label}</p>
                <p className="text-xs text-neutral-500">{r.stage}</p>
                <p className="mt-2 text-[11px] leading-snug text-neutral-400">
                  <span className="text-[#D4AF37]/90">{props.nextActionLabel}:</span> {dealNextActionHint(r)}
                </p>
              </div>
              <div className="text-right">
                <p className={`${cc.metric} text-sm text-[#D4AF37]`}>${(r.priceCents / 100).toLocaleString()}</p>
                {r.score != null ?
                  <p className="text-[10px] text-neutral-600">Score {r.score}</p>
                : null}
              </div>
              <div className="flex basis-full flex-wrap gap-2">
                <Link href={`/broker/residential/deals/${r.id}`} className={`${cc.linkSubtle}`}>
                  Open deal →
                </Link>
                <Link href="/dashboard/lecipm/listings/assistant" className="text-[11px] text-neutral-500 hover:text-[#D4AF37]">
                  Assistant follow-up
                </Link>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

function LeadList(props: {
  title: string;
  rows: CommandCenterPagePayload["summary"]["hotLeads"];
  muted?: boolean;
}) {
  return (
    <div className={`${props.muted ? cc.cardMuted : cc.card}`}>
      <h3 className="text-sm font-semibold text-[#f0ebe0]">{props.title}</h3>
      <ul className="mt-4 space-y-3">
        {props.rows.length === 0 ?
          <li className="text-sm text-neutral-600">No leads in this lane.</li>
        : props.rows.map((r) => (
            <li key={r.id} className="border-b border-[#232323]/80 pb-3 last:border-0">
              <p className="text-sm text-neutral-200">{r.contactLabel}</p>
              <p className="text-xs text-neutral-500">
                {r.status} · {r.intentLevel ?? "intent n/a"}
              </p>
              <p className="mt-2 text-[11px] text-neutral-400">
                <span className="text-[#D4AF37]/90">Action:</span> Reply and book a visit while intent is warm.
              </p>
              <Link href="/dashboard/lecipm/leads" className={`${cc.linkSubtle} mt-1 inline-block`}>
                Pipeline →
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}

function AlertsPanel(props: {
  rows: CommandCenterPagePayload["alerts"];
  onOpen: (r: CommandCenterPagePayload["alerts"][0]) => void;
}) {
  return (
    <div className={cc.card}>
      <ul className="space-y-3">
        {props.rows.length === 0 ?
          <li className="text-sm text-neutral-600">No urgent approvals in this window.</li>
        : props.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#232323]/60 pb-3 last:border-0">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-600">{r.kind}</p>
                <p className="text-sm text-neutral-100">{r.title}</p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Sensitive flows require explicit approval with audit trail — use quick view for context, decide in the
                  governed queue.
                </p>
              </div>
              <CcStatusBadge lane={r.severity} />
              <div className="flex basis-full gap-3">
                <Link href={r.href} className={cc.linkSubtle}>
                  Open →
                </Link>
                <button type="button" className="text-xs text-neutral-500 hover:text-[#D4AF37]" onClick={() => props.onOpen(r)}>
                  Quick view
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

function IntelligenceFeedColumn(props: { items: CommandCenterPagePayload["intelligenceFeed"] }) {
  return (
    <div className={`${cc.card} max-h-[min(70vh,820px)] overflow-y-auto`}>
      <ul className="space-y-4">
        {props.items.length === 0 ?
          <li className="text-sm text-neutral-600">Feed quiet — intelligence items will surface as operations move.</li>
        : props.items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-[#232323]/40 pb-4 last:border-0">
              <Icon name={item.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                    {item.domain}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide ${
                      item.severity === "CRITICAL" ? "text-red-300/90"
                      : item.severity === "WARNING" ? "text-[#D4AF37]/90"
                      : "text-neutral-600"
                    }`}
                  >
                    {item.severity}
                  </span>
                  <time className="text-[10px] text-neutral-600" dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm font-medium text-neutral-100">{item.title}</p>
                <p className="text-xs text-neutral-400">{item.explanation}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.recommendedActions.slice(0, 2).map((a) =>
                    a.href ?
                      <Link key={a.id} href={a.href} className={`${cc.linkSubtle} text-[11px]`}>
                        {a.label}
                      </Link>
                    : null,
                  )}
                  <Link href={item.href} className={`${cc.linkSubtle} text-[11px]`}>
                    Detail →
                  </Link>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

function QuickActionsBar(props: { viewMode: CommandCenterPagePayload["viewMode"] }) {
  const exec = props.viewMode === "executive";
  const actions = [
    { label: "Listing assistant", href: "/dashboard/lecipm/listings/assistant" },
    { label: "Hot leads", href: "/dashboard/lecipm/leads" },
    { label: "Disputes room", href: exec ? "/dashboard/admin/disputes" : "/dashboard/disputes" },
    { label: "Portfolio (classic)", href: "/dashboard/portfolio" },
    ...(exec ?
      [
        { label: "Approvals queue", href: "/dashboard/admin/full-autopilot" },
        { label: "Territory war room", href: "/dashboard/admin/territory-war-room" },
        { label: "Autonomy center", href: "/dashboard/admin/autonomy-command-center" },
        { label: "Trust console", href: "/dashboard/admin/trust-score" },
      ]
    : [
        { label: "Broker trust", href: "/dashboard/broker/trust" },
        { label: "Residential calendar", href: "/dashboard/broker/calendar" },
      ]),
  ];

  return (
    <section className="mb-10" aria-label="Quick actions">
      <h2 className={`${cc.sectionTitle} mb-4`}>Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={`${a.label}-${a.href}`}
            href={a.href}
            className="rounded-full border border-[#2a2a2a] bg-[#111] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-[#D4AF37]/40 hover:text-[#f4efe4]"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
