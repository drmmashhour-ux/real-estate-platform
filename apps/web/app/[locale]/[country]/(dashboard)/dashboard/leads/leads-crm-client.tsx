"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getContactWhatsAppUrl } from "@/lib/config/contact";
import {
  LAUNCH_DM_FIRST_CONTACT,
  personalizeLaunchTemplate,
} from "@/lib/launch/sales-scripts";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  propertyType?: string | null;
  estimatedValue?: number | null;
  dealValue?: number | null;
  commissionEstimate?: number | null;
  leadType?: string;
  leadSource?: string | null;
  score: number;
  temperature?: "hot" | "warm" | "cold";
  status?: string;
  pipelineStatus?: string;
  createdAt: string;
  nextFollowUpAt?: string | null;
  launchSalesContacted?: boolean;
  launchLastContactDate?: string | null;
  launchNotes?: string | null;
};

type PriorityLead = {
  id: string;
  name: string;
  score: number;
  nextFollowUpAt?: string | Date | null;
  nextActionAt?: string | Date | null;
  dealValue?: number | null;
  phone?: string;
};

type Summary = {
  total: number;
  hotLeads: number;
  newLeads: number;
  wonLeads: number;
  openPipelineCount?: number;
  consultationsRequested: number;
  conversionRate: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  pipelineBrokerCommission?: number;
  pipelineDealValueSum?: number;
  wonBrokerCommission?: number;
  avgDealSizeWon?: number;
  totalRevenueReference?: number;
  platformBnhubHostFeeReference?: number;
  closingPerformance?: {
    leadsByStage: Record<string, number>;
    avgFirstResponseMinutes: number | null;
    meetingsBooked: number;
    dealsWon: number;
    dealsLost: number;
    winRate: number;
    overdueFollowUps: number;
    hotLeadsNotContacted10m: number;
    qualifiedNoMeeting: number;
    closingInactive48h: number;
    inNegotiationOrClosing: number;
  };
  todaysPriorities?: {
    leadsToCall: PriorityLead[];
    followUpsDueToday: number;
    overdueLeads: number;
    hotLeadsSample: { id: string; name: string; score: number; dealValue?: number | null }[];
    recentLeads: { id: string; name: string; score: number; createdAt: string }[];
    meetingsToday?: { id: string; name: string; meetingAt: string; score: number }[];
    closingStageLeads?: { id: string; name: string; score: number; pipelineStatus?: string | null }[];
    urgentLeadCount?: number;
  };
  dmActions?: {
    newToMessage: number;
    followUpsDue: number;
    newSample: { id: string; name: string }[];
    followUpSample: { id: string; name: string; lastDmAt: string | null }[];
  };
  automation?: {
    urgentLeads: {
      id: string;
      name: string;
      score: number;
      pipelineStatus?: string | null;
      leadSource?: string | null;
      dealValue?: number | null;
      createdAt: string;
    }[];
    insights: string[];
    dailySummary: {
      newLeadsToday: number;
      callsNeeded: number;
      hotLeads: number;
      followUpsOverdue: number;
    };
    brokerNotifications: string[];
    performance: {
      conversionRate: number;
      revenueReference: number;
      touchpointsLogged7d: number;
      meetingsToday: number;
      wonDeals: number;
    };
  };
};

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";
const CARD = "#121212";

function bandClass(temperature: string | undefined, score: number): string {
  const band =
    temperature ?? (score >= 80 ? "hot" : score >= 50 ? "warm" : "cold");
  if (band === "hot") return "bg-orange-500/20 text-orange-200 border-orange-500/40";
  if (band === "warm") return "bg-premium-gold/15 text-premium-gold border-premium-gold/35";
  return "bg-white/5 text-[#9CA3AF] border-white/15";
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString()}`;
}

export function LeadsCrmClient({ isAdmin }: { isAdmin: boolean }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [band, setBand] = useState("");
  const [city, setCity] = useState("");
  const [leadType, setLeadType] = useState("");
  const [minDealValue, setMinDealValue] = useState("");
  const [cityRegion, setCityRegion] = useState("");
  const [hotHighValue, setHotHighValue] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim().length >= 2) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (band) p.set("band", band);
    if (city.trim()) p.set("city", city.trim());
    if (leadType) p.set("leadType", leadType);
    if (minDealValue.trim()) p.set("minDealValue", minDealValue.trim());
    if (cityRegion) p.set("cityRegion", cityRegion);
    if (hotHighValue) p.set("priority", "hot_high_value");
    return p.toString();
  }, [q, status, band, city, leadType, minDealValue, cityRegion, hotHighValue]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sumRes] = await Promise.all([
        fetch(`/api/leads${queryString ? `?${queryString}` : ""}`, { credentials: "same-origin" }),
        fetch("/api/leads/summary", { credentials: "same-origin" }),
      ]);
      if (res.status === 401) {
        setAuthError(true);
        setLeads([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setLeads(list);
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  const topLeads = useMemo(() => [...leads].sort((a, b) => b.score - a.score).slice(0, 10), [leads]);

  const weeklyBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const l of leads) {
      const d = new Date(l.createdAt);
      const key = `${d.getFullYear()}-W${Math.ceil(
        (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000
      )}`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
  }, [leads]);

  const patchLead = async (id: string, pipelineStatus: string) => {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pipelineStatus }),
      credentials: "same-origin",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Update failed");
      return;
    }
    load();
  };

  const patchLaunchFields = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
      credentials: "same-origin",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Update failed");
      return;
    }
    load();
  };

  const copyDmForLead = async (l: LeadRow) => {
    const text = personalizeLaunchTemplate(LAUNCH_DM_FIRST_CONTACT, {
      name: l.name,
      city: l.city,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Could not copy — try again.");
    }
  };

  const clientWhatsAppHref = (l: LeadRow) => {
    const dmText = personalizeLaunchTemplate(LAUNCH_DM_FIRST_CONTACT, { name: l.name, city: l.city });
    if (l.phone === "[Locked]") return getContactWhatsAppUrl(dmText);
    const digits = l.phone.replace(/\D/g, "");
    if (digits.length < 10) return getContactWhatsAppUrl(dmText);
    const e164 = digits.startsWith("1") ? digits : `1${digits}`;
    return `https://wa.me/${e164}?text=${encodeURIComponent(dmText)}`;
  };

  if (authError) {
    return (
      <main className="min-h-screen px-4 py-12 text-white" style={{ background: BG }}>
        <p className="text-[#B3B3B3]">
          Sign in as a broker or admin to access the CRM.{" "}
          <Link href="/login?next=/dashboard/leads" className="font-semibold" style={{ color: GOLD }}>
            Log in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white" style={{ background: BG }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              CRM
            </p>
            <h1 className="mt-2 text-3xl font-bold">Lead management</h1>
            <p className="mt-2 max-w-xl text-sm text-[#B3B3B3]">
              Evaluation funnel, FSBO, and platform leads. {isAdmin ? "Admin view — all records." : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/leads/pipeline"
              className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B] hover:opacity-95"
            >
              Pipeline board
            </Link>
            <Link
              href="/dashboard/training"
              className="rounded-xl border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
            >
              Training
            </Link>
            <Link
              href="/dashboard/broker"
              className="text-sm font-medium text-premium-gold hover:underline"
            >
              ← Broker dashboard
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/dashboard/admin/sales"
                  className="rounded-xl border border-premium-gold/50 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
                >
                  Sales scripts
                </Link>
                <Link
                  href="/dashboard/admin/daily"
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
                >
                  Daily dashboard
                </Link>
                <Link
                  href="/dashboard/admin/clients-acquisition"
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
                >
                  First 10 clients
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {summary?.dmActions &&
          (summary.dmActions.newToMessage > 0 || summary.dmActions.followUpsDue > 0) && (
            <section
              className="mt-8 rounded-2xl border border-premium-gold/40 p-5"
              style={{ background: CARD }}
            >
              <h2 className="text-lg font-bold text-white">DM actions</h2>
              <p className="mt-1 text-xs text-[#737373]">
                Organic / social — copy templates on the lead page. Follow-ups due 24h after last send with no reply.
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-premium-gold">
                    New leads to message ({summary.dmActions.newToMessage})
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {summary.dmActions.newSample.length === 0 ? (
                      <li className="text-[#737373]">—</li>
                    ) : (
                      summary.dmActions.newSample.map((l) => (
                        <li key={l.id}>
                          <Link
                            href={`/dashboard/leads/${l.id}`}
                            className="font-medium text-premium-gold hover:underline"
                          >
                            {l.name}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-300/90">
                    Leads to follow up (DM) ({summary.dmActions.followUpsDue})
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {summary.dmActions.followUpSample.length === 0 ? (
                      <li className="text-[#737373]">None due.</li>
                    ) : (
                      summary.dmActions.followUpSample.map((l) => (
                        <li key={l.id} className="flex flex-col gap-0.5">
                          <Link
                            href={`/dashboard/leads/${l.id}`}
                            className="font-medium text-amber-200 hover:underline"
                          >
                            {l.name}
                          </Link>
                          {l.lastDmAt ? (
                            <span className="text-[10px] text-[#737373]">
                              Last DM: {new Date(l.lastDmAt).toLocaleString()}
                            </span>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

        {summary?.automation && (
            <section
              className="mt-8 grid gap-4 lg:grid-cols-2"
              style={{ fontFamily: "inherit" }}
            >
              <div
                className="rounded-2xl border border-premium-gold/45 p-5 shadow-[inset_0_1px_0_rgb(var(--premium-gold-channels) / 0.12)]"
                style={{ background: CARD }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Urgent leads
                </p>
                <p className="mt-1 text-xs text-[#737373]">
                  SLA risk, high intent without DM, or stale follow-ups (automation rules).
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {summary.automation.urgentLeads.length === 0 ? (
                    <li className="text-[#737373]">All clear — no urgent queue right now.</li>
                  ) : (
                    summary.automation.urgentLeads.map((l) => (
                      <li key={l.id}>
                        <Link
                          href={`/dashboard/leads/${l.id}`}
                          className="font-semibold text-premium-gold hover:underline"
                        >
                          {l.name}
                        </Link>
                        <span className="ml-2 text-xs text-[#737373]">
                          · score {l.score}
                          {l.dealValue != null ? ` · ~$${l.dealValue.toLocaleString()}` : ""}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 p-5" style={{ background: CARD }}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Daily pulse &amp; alerts
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#B3B3B3]">
                  <div>
                    New today:{" "}
                    <span className="font-bold text-white">
                      {summary.automation.dailySummary.newLeadsToday}
                    </span>
                  </div>
                  <div>
                    Calls needed:{" "}
                    <span className="font-bold text-amber-200">
                      {summary.automation.dailySummary.callsNeeded}
                    </span>
                  </div>
                  <div>
                    Hot pool:{" "}
                    <span className="font-bold text-orange-200">
                      {summary.automation.dailySummary.hotLeads}
                    </span>
                  </div>
                  <div>
                    Overdue F/U:{" "}
                    <span className="font-bold text-red-300/90">
                      {summary.automation.dailySummary.followUpsOverdue}
                    </span>
                  </div>
                </div>
                {summary.automation.brokerNotifications.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-premium-gold/95">
                    {summary.automation.brokerNotifications.map((n, i) => (
                      <li key={i}>● {n}</li>
                    ))}
                  </ul>
                ) : null}
                {summary.automation.insights.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-[#9CA3AF]">
                    <li className="font-semibold text-[#737373]">Insights</li>
                    {summary.automation.insights.map((line, i) => (
                      <li key={i}>— {line}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 border-t border-white/10 pt-3 text-[10px] text-[#737373]">
                  Conversion {summary.automation.performance.conversionRate}% · Revenue ref. $
                  {summary.automation.performance.revenueReference.toLocaleString()} · Logged touches
                  (7d): {summary.automation.performance.touchpointsLogged7d} · Meetings today:{" "}
                  {summary.automation.performance.meetingsToday}
                </div>
              </div>
            </section>
          )}

        {/* Summary */}
        {summary && (
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total leads", summary.total],
              ["Hot", summary.hotLeads],
              ["New", summary.newLeads],
              ["Open pipeline", summary.openPipelineCount ?? "—"],
              ["Consult requests", summary.consultationsRequested],
              ["Won", summary.wonLeads],
              ["Conv. rate", `${summary.conversionRate}%`],
              ["Due today", summary.followUpsDueToday],
              ["Overdue", summary.overdueFollowUps],
              [
                "Pipeline est. commission",
                summary.pipelineBrokerCommission != null
                  ? `$${summary.pipelineBrokerCommission.toLocaleString()}`
                  : "—",
              ],
              [
                "Won commission",
                summary.wonBrokerCommission != null
                  ? `$${summary.wonBrokerCommission.toLocaleString()}`
                  : "—",
              ],
              [
                "Avg closed deal",
                summary.avgDealSizeWon
                  ? `$${summary.avgDealSizeWon.toLocaleString()}`
                  : "—",
              ],
              [
                "Ref. BNHUB host cut (15%)",
                summary.platformBnhubHostFeeReference != null
                  ? `$${summary.platformBnhubHostFeeReference.toLocaleString()}`
                  : "—",
              ],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-premium-gold/25 px-4 py-3"
                style={{ background: CARD }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                  {label}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">{val}</p>
              </div>
            ))}
          </section>
        )}

        {summary?.closingPerformance ? (
          <section
            className="mt-8 rounded-2xl border border-premium-gold/25 p-5"
            style={{ background: CARD }}
          >
            <h2 className="text-lg font-bold text-white">Closing performance</h2>
            <p className="mt-1 text-xs text-[#737373]">
              Leads by stage · response time · win rate · pipeline risk flags.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(summary.closingPerformance.leadsByStage)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([stage, count]) => (
                  <span
                    key={stage}
                    className="rounded-full border border-premium-gold/35 bg-black/40 px-3 py-1 text-xs font-semibold text-premium-gold"
                  >
                    {stage.replace(/_/g, " ")}: {count}
                  </span>
                ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["Avg first response", summary.closingPerformance.avgFirstResponseMinutes != null ? `${summary.closingPerformance.avgFirstResponseMinutes} min` : "—"],
                  ["Meetings today", String(summary.closingPerformance.meetingsBooked)],
                  ["Win rate", `${summary.closingPerformance.winRate}%`],
                  ["Deals won", String(summary.closingPerformance.dealsWon)],
                  ["Deals lost", String(summary.closingPerformance.dealsLost)],
                  ["Overdue F/U", String(summary.closingPerformance.overdueFollowUps)],
                  ["Hot &gt;10m no contact", String(summary.closingPerformance.hotLeadsNotContacted10m)],
                  ["Qualified no meeting", String(summary.closingPerformance.qualifiedNoMeeting)],
                  ["Closing idle 48h+", String(summary.closingPerformance.closingInactive48h)],
                  ["In negotiation/closing", String(summary.closingPerformance.inNegotiationOrClosing)],
                ] as const
              ).map(([label, val]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-[#0B0B0B] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#737373]">{label}</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{val}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {summary?.todaysPriorities ? (
          <section
            className="mt-8 rounded-2xl border border-premium-gold/30 p-5"
            style={{ background: CARD }}
          >
            <h2 className="text-lg font-bold text-white">Today&apos;s closing priorities</h2>
            <p className="mt-1 text-xs text-[#737373]">
              Urgent leads · calls · hot list · meetings · closing stage · recent intake.
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-premium-gold">Leads to call</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {summary.todaysPriorities.leadsToCall.length === 0 ? (
                    <li className="text-[#737373]">None overdue.</li>
                  ) : (
                    summary.todaysPriorities.leadsToCall.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/dashboard/leads/${l.id}`} className="font-medium text-white hover:text-premium-gold">
                          {l.name}
                        </Link>
                        <span className="text-xs text-[#737373]">Score {l.score}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-premium-gold">Hot leads</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {summary.todaysPriorities.hotLeadsSample.map((l) => (
                    <li key={l.id}>
                      <Link href={`/dashboard/leads/${l.id}`} className="text-premium-gold hover:underline">
                        {l.name}
                      </Link>
                      <span className="text-[#737373]"> · {l.score}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-semibold uppercase text-premium-gold">Recent leads</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {summary.todaysPriorities.recentLeads.map((l) => (
                    <li key={l.id}>
                      <Link href={`/dashboard/leads/${l.id}`} className="text-white hover:text-premium-gold">
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-premium-gold">Meetings today</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {(summary.todaysPriorities.meetingsToday?.length ?? 0) === 0 ? (
                    <li className="text-[#737373]">None scheduled.</li>
                  ) : (
                    summary.todaysPriorities.meetingsToday!.map((m) => (
                      <li key={m.id} className="flex flex-col gap-0.5">
                        <Link href={`/dashboard/leads/${m.id}`} className="font-medium text-premium-gold hover:underline">
                          {m.name}
                        </Link>
                        <span className="text-xs text-[#737373]">
                          {new Date(m.meetingAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                <p className="mt-3 text-xs text-[#737373]">
                  Follow-ups due today: {summary.todaysPriorities.followUpsDueToday} · Overdue:{" "}
                  {summary.todaysPriorities.overdueLeads}
                </p>
                <p className="mt-2 text-xs text-[#737373]">
                  Urgent pipeline:{" "}
                  <span className="font-bold text-orange-200">
                    {summary.todaysPriorities.urgentLeadCount ?? "—"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-premium-gold">In closing / negotiation</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {(summary.todaysPriorities.closingStageLeads?.length ?? 0) === 0 ? (
                    <li className="text-[#737373]">None in closing right now.</li>
                  ) : (
                    summary.todaysPriorities.closingStageLeads!.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/dashboard/leads/${l.id}`}
                          className="font-medium text-premium-gold hover:underline"
                        >
                          {l.name}
                        </Link>
                        <span className="text-xs capitalize text-[#737373]">
                          {(l.pipelineStatus ?? "").replace(/_/g, " ")} · {l.score}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {/* Follow-up strip */}
        {summary && (summary.followUpsDueToday > 0 || summary.overdueFollowUps > 0) ? (
          <div
            className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          >
            <strong>Attention:</strong> {summary.overdueFollowUps} overdue follow-up
            {summary.overdueFollowUps !== 1 ? "s" : ""} · {summary.followUpsDueToday} due today. Filter by
            status &amp; open lead detail to reschedule.
          </div>
        ) : null}

        {/* Top leads */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">Top leads</h2>
          <p className="text-xs text-[#737373]">Highest CRM score (first 10 in current filter set).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {topLeads.length === 0 ? (
              <span className="text-sm text-[#737373]">No leads match.</span>
            ) : (
              topLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/leads/${l.id}`}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${bandClass(l.temperature, l.score)}`}
                >
                  {l.name} · {l.score}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Simple chart */}
        {weeklyBuckets.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-white">Leads per week (approx.)</h2>
            <div className="mt-4 flex h-28 items-end gap-1">
              {weeklyBuckets.map(([k, n]) => (
                <div key={k} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full max-w-[40px] rounded-t bg-premium-gold/70"
                    style={{ height: `${Math.max(8, Math.min(100, n * 12))}%` }}
                    title={`${k}: ${n}`}
                  />
                  <span className="max-w-[48px] truncate text-[9px] text-[#737373]">{k}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section
          className="mt-10 grid gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-6"
          style={{ background: CARD }}
        >
          <input
            placeholder="Search name, email, address…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold focus:outline-none focus:ring-1 focus:ring-premium-gold/40 lg:col-span-2"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white focus:border-premium-gold"
          >
            <option value="">All statuses</option>
            {["new", "contacted", "qualified", "meeting", "negotiation", "follow_up", "won", "lost"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              )
            )}
          </select>
          <select
            value={band}
            onChange={(e) => setBand(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white focus:border-premium-gold"
          >
            <option value="">All score bands</option>
            <option value="hot">Hot (80+)</option>
            <option value="warm">Warm (50–79)</option>
            <option value="cold">Cold (&lt;50)</option>
          </select>
          <input
            placeholder="City contains…"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold focus:outline-none"
          />
          <select
            value={leadType}
            onChange={(e) => setLeadType(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white focus:border-premium-gold"
          >
            <option value="">All lead types</option>
            <option value="evaluation_lead">Evaluation</option>
            <option value="fsbo_lead">FSBO</option>
            <option value="booking_lead">Booking</option>
            <option value="broker_consultation">Consultation</option>
          </select>
          <input
            placeholder="Min deal $ (e.g. 500000)"
            value={minDealValue}
            onChange={(e) => setMinDealValue(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold focus:outline-none"
          />
          <select
            value={cityRegion}
            onChange={(e) => setCityRegion(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white focus:border-premium-gold"
          >
            <option value="">All cities</option>
            <option value="mtl_laval">Montreal + Laval</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-[#B3B3B3] sm:col-span-2">
            <input
              type="checkbox"
              checked={hotHighValue}
              onChange={(e) => setHotHighValue(e.target.checked)}
              className="rounded border-white/20"
            />
            HOT only + value ≥ $500k
          </label>
        </section>

        {/* Table */}
        <section className="mt-6 overflow-x-auto rounded-2xl border border-white/10" style={{ background: CARD }}>
          {loading ? (
            <p className="p-8 text-sm text-[#737373]">Loading…</p>
          ) : leads.length === 0 ? (
            <p className="p-8 text-sm text-[#737373]">No leads yet.</p>
          ) : (
            <table className="min-w-[1280px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-[#737373]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Est. value</th>
                  <th className="px-4 py-3">Est. comm.</th>
                  <th className="px-4 py-3">Lead type</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">
                    Outreach
                    <span className="block text-[9px] font-normal normal-case text-[#737373]">contacted · last contact</span>
                  </th>
                  <th className="px-4 py-3">Sales notes</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const digits = l.phone.replace(/\D/g, "");
                  const telHref =
                    l.phone && l.phone !== "[Locked]" && digits.length >= 10
                      ? `tel:${l.phone.replace(/[^\d+]/g, "")}`
                      : null;
                  const wa = clientWhatsAppHref(l);
                  return (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">{l.name}</td>
                    <td className="px-4 py-3 text-[#B3B3B3]">{l.email}</td>
                    <td className="px-4 py-3 text-[#B3B3B3]">{l.phone}</td>
                    <td className="px-4 py-3 text-[#B3B3B3]">{l.city ?? "—"}</td>
                    <td className="px-4 py-3 text-[#B3B3B3]">{l.propertyType ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-white">
                      {fmtMoney(l.dealValue ?? l.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-premium-gold">
                      {fmtMoney(l.commissionEstimate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#B3B3B3]">{l.leadType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${bandClass(l.temperature, l.score)}`}
                      >
                        {l.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-premium-gold">
                      {(l.pipelineStatus || l.status || "new").replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                          <input
                            type="checkbox"
                            checked={Boolean(l.launchSalesContacted)}
                            onChange={(e) =>
                              void patchLaunchFields(l.id, { launchSalesContacted: e.target.checked })
                            }
                            className="rounded border-premium-gold/40"
                          />
                          Contacted
                        </label>
                        <p className="text-[10px] text-[#737373]">
                          {l.launchLastContactDate
                            ? new Date(l.launchLastContactDate).toLocaleDateString()
                            : "—"}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => void copyDmForLead(l)}
                            className="rounded border border-premium-gold/45 px-2 py-0.5 text-[10px] font-semibold text-premium-gold hover:bg-premium-gold/10"
                          >
                            Copy DM
                          </button>
                          {telHref ? (
                            <a
                              href={telHref}
                              className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-white hover:bg-white/5"
                            >
                              Call client
                            </a>
                          ) : null}
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/10"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <textarea
                        key={`${l.id}-${l.launchNotes ?? ""}`}
                        defaultValue={l.launchNotes ?? ""}
                        placeholder="Quick note…"
                        rows={2}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const prev = (l.launchNotes ?? "").trim();
                          if (v !== prev) void patchLaunchFields(l.id, { launchNotes: v });
                        }}
                        className="w-40 max-w-[12rem] rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1 text-xs text-white placeholder:text-[#737373]"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#737373]">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          href={`/dashboard/leads/${l.id}`}
                          className="rounded-lg border border-premium-gold/40 px-2 py-1 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => patchLead(l.id, "contacted")}
                          className="rounded-lg bg-premium-gold px-2 py-1 text-xs font-bold text-[#0B0B0B]"
                        >
                          Stage: contacted
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
