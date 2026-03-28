"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrencyCAD } from "@/lib/investment/format";
import { useToast } from "@/components/ui/ToastProvider";
import { FREE_BROKER_VISIBLE_LEADS } from "@/modules/mortgage/services/broker-lead-limits";
import type { BrokerLeadRow } from "@/modules/mortgage/services/map-broker-lead";
import { PreApprovalEstimateCard } from "@/components/mortgage/PreApprovalEstimateCard";

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40";
  if (s === "contacted") return "bg-sky-500/15 text-sky-200 ring-sky-500/40";
  return "bg-amber-500/15 text-amber-100 ring-amber-500/35";
}

function intentBadgeClass(intent: string): string {
  const i = intent.toLowerCase();
  if (i === "high") return "bg-emerald-500/20 text-emerald-100 ring-emerald-400/50";
  if (i === "medium") return "bg-amber-500/15 text-amber-100 ring-amber-400/40";
  return "bg-slate-600/30 text-slate-300 ring-slate-500/30";
}

function timelineLabel(t: string): string {
  switch (t) {
    case "immediate":
      return "ASAP / immediate";
    case "1-3 months":
      return "1–3 months";
    case "3+ months":
      return "3+ months";
    default:
      return t;
  }
}

async function trackUpgradeClick(): Promise<void> {
  try {
    await fetch("/api/broker/mortgage/upgrade-click", { method: "POST", credentials: "include" });
  } catch {
    /* ignore */
  }
}

export function BrokerDashboardClient() {
  const { showToast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<BrokerLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isAdminView, setIsAdminView] = useState(false);
  const [analytics, setAnalytics] = useState<{
    leadsViewedTotal: number;
    upgradeClickCount: number;
    totalLeadUnlocks: number;
    totalLeadUnlockRevenue: number;
  } | null>(null);
  const [weeklyFreeUnlocksRemaining, setWeeklyFreeUnlocksRemaining] = useState<number | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [valueProposition, setValueProposition] = useState<string | null>(null);
  const [confidenceLine, setConfidenceLine] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/broker/mortgage-requests", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof json.error === "string" ? json.error : "Could not load requests", "info");
        setRows([]);
        return;
      }
      setPlan(typeof json.plan === "string" ? json.plan : null);
      setIsAdminView(json.plan === "admin");
      setTotalLeads(typeof json.totalLeads === "number" ? json.totalLeads : 0);
      if (typeof json.valueProposition === "string") setValueProposition(json.valueProposition);
      if (typeof json.confidenceLine === "string") setConfidenceLine(json.confidenceLine);
      if (json.analytics && typeof json.analytics === "object") {
        const a = json.analytics as {
          leadsViewedTotal?: number;
          upgradeClickCount?: number;
          totalLeadUnlocks?: number;
          totalLeadUnlockRevenue?: number;
        };
        setAnalytics({
          leadsViewedTotal: typeof a.leadsViewedTotal === "number" ? a.leadsViewedTotal : 0,
          upgradeClickCount: typeof a.upgradeClickCount === "number" ? a.upgradeClickCount : 0,
          totalLeadUnlocks: typeof a.totalLeadUnlocks === "number" ? a.totalLeadUnlocks : 0,
          totalLeadUnlockRevenue: typeof a.totalLeadUnlockRevenue === "number" ? a.totalLeadUnlockRevenue : 0,
        });
      } else {
        setAnalytics(null);
      }
      if (typeof json.weeklyFreeUnlocksRemaining === "number") {
        setWeeklyFreeUnlocksRemaining(json.weeklyFreeUnlocksRemaining);
      } else {
        setWeeklyFreeUnlocksRemaining(null);
      }
      setRows(Array.isArray(json.requests) ? json.requests : []);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("unlock");
    if (q === "success") {
      showToast("Payment received — contact is unlocked.", "success");
      window.history.replaceState({}, "", "/broker/dashboard");
      void load();
    } else if (q === "cancel") {
      showToast("Checkout cancelled.", "info");
      window.history.replaceState({}, "", "/broker/dashboard");
    }
  }, [showToast, load]);

  const unlockLead = async (id: string) => {
    setUnlockingId(id);
    try {
      const res = await fetch(`/api/broker/mortgage-requests/${id}/unlock`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; checkoutUrl?: string };
      if (!res.ok) {
        showToast(typeof json.error === "string" ? json.error : "Could not unlock contact", "info");
        return;
      }
      if (typeof json.checkoutUrl === "string" && json.checkoutUrl.length > 0) {
        window.location.href = json.checkoutUrl;
        return;
      }
      showToast("Borrower contact unlocked.", "success");
      await load();
      router.refresh();
    } finally {
      setUnlockingId(null);
    }
  };

  const patchStatus = async (id: string, status: "contacted" | "approved") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/broker/mortgage-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; promptClientReview?: boolean };
      if (!res.ok) {
        showToast(typeof json.error === "string" ? json.error : "Update failed", "info");
        return;
      }
      showToast(
        json.promptClientReview
          ? `Marked ${status}. The client can now rate their experience.`
          : `Marked ${status}`,
        "success"
      );
      await load();
      router.refresh();
    } finally {
      setUpdating(null);
    }
  };

  const isPro = plan === "pro";

  return (
    <div className="space-y-8">
      {!isAdminView ? (
        <div className="rounded-2xl border border-emerald-500/45 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-50">
          <span className="font-semibold">Identity Verified Broker</span>
          <span className="text-emerald-200/90"> — license and identity reviewed; you are cleared to receive leads.</span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-center text-sm text-amber-100/95">
        <strong className="text-amber-50">New leads added daily</strong>
        <span className="text-amber-100/80"> — serious investors analyzing deals on LECIPM.</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Mortgage</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Broker dashboard</h1>
          {valueProposition ? (
            <p className="mt-2 max-w-xl text-base font-medium text-premium-gold">{valueProposition}</p>
          ) : (
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Get qualified real estate leads. Connect with serious investors — requests assigned to you update in real time.
            </p>
          )}
          {confidenceLine ? (
            <p className="mt-2 max-w-xl text-sm text-slate-500">{confidenceLine}</p>
          ) : null}
          {!isAdminView && plan ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm">
              <span className="text-slate-500">Plan:</span>
              {isPro ? (
                <span className="rounded-full bg-premium-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-premium-gold ring-1 ring-premium-gold/45">
                  Pro
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 ring-1 ring-white/15">
                  Free · {FREE_BROKER_VISIBLE_LEADS} latest leads
                </span>
              )}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isAdminView && !isPro ? (
            <Link
              href="/broker/pricing"
              onClick={() => void trackUpgradeClick()}
              className="btn-primary min-h-[44px] justify-center px-5"
            >
              Upgrade to Pro
            </Link>
          ) : null}
          <Link
            href="/mortgage"
            className="text-sm font-medium text-premium-gold hover:text-premium-gold hover:underline"
          >
            Public mortgage page
          </Link>
        </div>
      </div>

      {!isAdminView && analytics ? (
        <p className="text-xs text-slate-500">
          Activity: <span className="text-slate-400">{analytics.leadsViewedTotal}</span> lead views tracked ·{" "}
          <span className="text-slate-400">{analytics.upgradeClickCount}</span> upgrade clicks ·{" "}
          <span className="text-slate-400">{analytics.totalLeadUnlocks}</span> contact unlocks ·{" "}
          <span className="text-slate-400">{formatCurrencyCAD(analytics.totalLeadUnlockRevenue)}</span> paid unlock
          spend
          {isPro && weeklyFreeUnlocksRemaining !== null ? (
            <>
              {" "}
              · <span className="text-emerald-400/90">{weeklyFreeUnlocksRemaining}</span> free Pro unlocks left this
              week
            </>
          ) : null}
        </p>
      ) : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" aria-hidden />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-slate-400">
          No mortgage requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {rows.map((r) => {
              const highIntent = r.intentLevel?.toLowerCase() === "high";
              const ringClass =
                highIntent && !r.locked
                  ? "border-emerald-500/40 ring-2 ring-emerald-500/35"
                  : "border-white/10";

              return (
                <article
                  key={r.id}
                  className={`relative rounded-2xl border bg-white/[0.03] p-5 shadow-lg shadow-black/20 sm:p-6 ${ringClass} ${
                    r.locked ? "overflow-hidden" : ""
                  }`}
                >
                  {r.locked ? (
                    <>
                      <div className="pointer-events-none select-none blur-sm" aria-hidden>
                        <LockedLeadPreview r={r} badgeClass={badgeClass} intentBadgeClass={intentBadgeClass} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#0B0B0B]/75 px-4 text-center backdrop-blur-[2px]">
                        <p className="text-sm font-semibold text-white">Upgrade to Pro to access all leads</p>
                        <p className="mt-1 max-w-xs text-xs text-slate-400">
                          Free shows only the {FREE_BROKER_VISIBLE_LEADS} newest requests.
                        </p>
                        {r.estimatedApprovalAmount != null && r.approvalConfidence ? (
                          <p className="mt-3 font-mono text-sm text-premium-gold">
                            Est. approval {formatCurrencyCAD(r.estimatedApprovalAmount)} ·{" "}
                            <span className="capitalize">{r.approvalConfidence}</span> confidence
                          </p>
                        ) : null}
                      </div>
                      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[1] -translate-x-1/2">
                        <Link
                          href="/broker/pricing"
                          onClick={() => void trackUpgradeClick()}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-premium-gold px-5 py-3 text-sm font-bold text-[#0B0B0B] shadow-lg hover:bg-premium-gold"
                        >
                          Upgrade to Pro
                        </Link>
                      </div>
                    </>
                  ) : (
                    <LeadCardBody
                      r={r}
                      badgeClass={badgeClass}
                      intentBadgeClass={intentBadgeClass}
                      formatTimeline={timelineLabel}
                      updating={updating}
                      onPatch={patchStatus}
                      isPro={isPro}
                      weeklyFreeUnlocksRemaining={weeklyFreeUnlocksRemaining}
                      unlockingId={unlockingId}
                      onUnlock={unlockLead}
                    />
                  )}
                </article>
              );
            })}
          </div>

          {!isAdminView && !isPro && totalLeads > FREE_BROKER_VISIBLE_LEADS ? (
            <p className="text-center text-xs text-slate-500">
              Showing {FREE_BROKER_VISIBLE_LEADS} of {totalLeads} leads ·{" "}
              <Link href="/broker/pricing" onClick={() => void trackUpgradeClick()} className="text-premium-gold hover:underline">
                Unlock the rest
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function LockedLeadPreview({
  r,
  badgeClass,
  intentBadgeClass,
}: {
  r: BrokerLeadRow;
  badgeClass: (s: string) => string;
  intentBadgeClass: (s: string) => string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{r.freshnessLabel}</p>
          <p className="mt-1 font-mono text-lg font-semibold text-white">{formatCurrencyCAD(r.propertyPrice)}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${intentBadgeClass(r.intentLevel)}`}
        >
          {r.intentLevel} intent
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{timelineLabel(r.timeline)}</p>
      <span
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${badgeClass(r.status)}`}
      >
        {r.status}
      </span>
    </>
  );
}

function LeadCardBody({
  r,
  badgeClass,
  intentBadgeClass,
  formatTimeline: tl,
  updating,
  onPatch,
  isPro,
  weeklyFreeUnlocksRemaining,
  unlockingId,
  onUnlock,
}: {
  r: BrokerLeadRow;
  badgeClass: (s: string) => string;
  intentBadgeClass: (s: string) => string;
  formatTimeline: (t: string) => string;
  updating: string | null;
  onPatch: (id: string, s: "contacted" | "approved") => void;
  isPro: boolean;
  weeklyFreeUnlocksRemaining: number | null;
  unlockingId: string | null;
  onUnlock: (id: string) => void | Promise<void>;
}) {
  const [contactClientOpen, setContactClientOpen] = useState(false);
  const contactLocked = r.contactLocked;
  const showFinancials = !contactLocked;
  const unlockLabel =
    isPro && (weeklyFreeUnlocksRemaining ?? 0) > 0
      ? `Unlock contact (free · ${weeklyFreeUnlocksRemaining} left this week)`
      : `Unlock contact (${formatCurrencyCAD(r.leadValue)})`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-premium-gold/90">{r.freshnessLabel}</p>
          {r.intentLevel?.toLowerCase() === "high" ? (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400/90">
              High-quality lead
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${intentBadgeClass(r.intentLevel)}`}
          >
            {r.intentLevel} intent
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${badgeClass(r.status)}`}
          >
            {r.status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Buy timeline</p>
          <p className="mt-0.5 font-medium text-slate-200">{tl(r.timeline)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pre-approved</p>
          <p className="mt-0.5 font-medium text-slate-200">{r.preApproved ? "Yes" : "No"}</p>
        </div>
      </div>

      {r.estimatedApprovalAmount != null &&
      r.estimatedMonthlyPayment != null &&
      r.approvalConfidence ? (
        <div className="mt-4">
          <PreApprovalEstimateCard
            estimate={{
              estimatedApprovalAmount: r.estimatedApprovalAmount,
              estimatedMonthlyPayment: r.estimatedMonthlyPayment,
              approvalConfidence: r.approvalConfidence,
            }}
            showDisclaimer={false}
          />
        </div>
      ) : null}

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Property price</dt>
          <dd className="font-mono font-semibold text-white">{formatCurrencyCAD(r.propertyPrice)}</dd>
        </div>
        {showFinancials ? (
          <>
            <div>
              <dt className="text-slate-500">Down payment</dt>
              <dd className="font-mono text-slate-200">{formatCurrencyCAD(r.downPayment ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Income</dt>
              <dd className="font-mono text-slate-200">{formatCurrencyCAD(r.income ?? 0)}</dd>
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Financial detail</dt>
            <dd className="text-sm text-slate-500">
              Income &amp; down payment are revealed when you unlock this lead.
            </dd>
          </div>
        )}
      </dl>

      {showFinancials ? (
        <p className="mt-3 font-mono text-xs text-slate-500">
          User ID <span className="text-slate-400">{r.userId}</span>
        </p>
      ) : null}

      {contactLocked ? (
        <div className="mt-5 space-y-3 rounded-2xl border border-premium-gold/30 bg-[#14110a]/50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">This lead is exclusive</p>
          <p className="text-sm font-semibold text-premium-gold">Borrower contact locked</p>
          <p className="text-sm text-slate-400">Email and phone are hidden until you unlock. Unlock before others.</p>
          <p className="text-xs text-slate-500">
            Lead price <span className="font-mono text-premium-gold">{formatCurrencyCAD(r.leadValue)}</span>
            {isPro && (weeklyFreeUnlocksRemaining ?? 0) > 0 ? (
              <span className="text-emerald-400/90"> · Pro includes free weekly unlocks</span>
            ) : null}
          </p>
          <button
            type="button"
            disabled={unlockingId === r.id}
            onClick={() => void onUnlock(r.id)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-premium-gold px-4 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold disabled:opacity-50 sm:w-auto"
          >
            {unlockingId === r.id ? "Please wait…" : unlockLabel}
          </button>
          {!isPro ? (
            <p className="text-xs text-slate-500">
              Want more visible leads?{" "}
              <Link href="/broker/pricing" className="font-medium text-premium-gold hover:underline">
                Upgrade to Pro
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => setContactClientOpen((v) => !v)}
            className="min-h-[44px] w-full rounded-xl border border-premium-gold/50 bg-premium-gold/10 px-4 py-3 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/20 sm:w-auto"
          >
            {contactClientOpen ? "Hide client contact" : "Contact Client"}
          </button>
          {contactClientOpen ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client contact</p>
              <p className="mt-1 text-xs text-slate-500">
                Reach out by email or phone — communication stays outside the app for now.
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-slate-200">{r.borrowerName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    {r.borrowerEmail ? (
                      <a href={`mailto:${r.borrowerEmail}`} className="break-all text-premium-gold hover:underline">
                        {r.borrowerEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd>
                    {r.borrowerPhone ? (
                      <a href={`tel:${r.borrowerPhone.replace(/\s/g, "")}`} className="text-premium-gold hover:underline">
                        {r.borrowerPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">Submitted {new Date(r.createdAt).toLocaleString()}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={updating === r.id}
          onClick={() => void onPatch(r.id, "contacted")}
          className="min-h-[44px] rounded-xl border border-sky-500/50 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-50"
        >
          Mark as contacted
        </button>
        <button
          type="button"
          disabled={updating === r.id}
          onClick={() => void onPatch(r.id, "approved")}
          className="min-h-[44px] rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          Mark as approved
        </button>
      </div>
    </>
  );
}
