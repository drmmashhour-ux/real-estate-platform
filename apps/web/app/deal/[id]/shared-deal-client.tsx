"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { formatCurrencyCAD, formatRoiPercent } from "@/lib/investment/format";
import type { SharedDealPublicPayload } from "@/lib/investment/shared-deal-public";
import { RENTAL_TYPE, rentalTypeLabel } from "@/lib/investment/rental-model";
import { GeneratedByLecipm } from "@/components/brand/GeneratedByLecipm";
import { ShareDealButton } from "@/components/investment/ShareDealButton";
import { SharedDealViewTracker } from "@/components/investment/SharedDealViewTracker";
import { getTrackingSessionId, track, TrackingEvent } from "@/lib/tracking";

type Props = {
  payload: SharedDealPublicPayload;
  referrerDealId?: string;
  /** ?ru= sharer user id */
  referrerUserId?: string;
};

export function SharedDealClient({ payload, referrerDealId, referrerUserId }: Props) {
  const [email, setEmail] = useState("");
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [waitMessage, setWaitMessage] = useState("");

  useEffect(() => {
    track(TrackingEvent.SHARED_DEAL_PAGE_VIEW, {
      path: typeof window !== "undefined" ? window.location.pathname : `/deal/${payload.id}`,
      meta: { dealId: payload.id, mode: payload.mode },
    });
  }, [payload.id, payload.mode]);

  function trackAnalyzeClick() {
    track(TrackingEvent.SHARED_DEAL_ANALYZE_CLICK, {
      meta: { dealId: payload.id, cta: "start_free_analysis" },
    });
    track(TrackingEvent.CTA_CLICKED, {
      meta: { label: "start_free_analysis", source: "shared_deal", dealId: payload.id },
    });
  }

  async function onWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWaitMessage("");
    setWaitStatus("loading");
    try {
      const sessionId = getTrackingSessionId();
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "shared_deal",
          dealId: payload.id,
          sessionId: sessionId ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setWaitStatus("err");
        setWaitMessage(data.error ?? "Something went wrong.");
        return;
      }
      track(TrackingEvent.SHARED_DEAL_WAITLIST_EMAIL, {
        meta: { dealId: payload.id },
      });
      setWaitStatus("ok");
      setWaitMessage("You’re in — check your inbox for tips.");
      setEmail("");
    } catch {
      setWaitStatus("err");
      setWaitMessage("Network error. Try again.");
    }
  }

  const stWins =
    payload.mode === "dual"
      ? payload.dual.shortTermWinsOnRoi
      : payload.mode === "dual_stored"
        ? payload.roiShortTerm > payload.roiLongTerm
        : false;

  return (
    <>
      <SharedDealViewTracker
        dealId={payload.id}
        referrerDealId={referrerDealId}
        referrerUserId={referrerUserId}
      />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:pt-14">
      <header className="border-b border-white/[0.07] pb-8 text-center">
        <p className="font-serif text-lg font-semibold tracking-wide text-premium-gold sm:text-xl">
          LECIPM Analysis Report
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#9CA3AF]">
          Shared analysis · illustrative only
        </p>
      </header>
      <div className="mt-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold/90">Shared deal · LECIPM</p>
        <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          See how this real estate deal performs
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-slate-400 sm:text-lg">
          Long-term vs short-term — side-by-side ROI and cash flow (illustrative, not financial advice).
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/analyze#analyzer"
            onClick={() => {
              track(TrackingEvent.SHARED_DEAL_ANALYZE_CLICK, {
                meta: { dealId: payload.id, cta: "try_own_analysis_seconds" },
              });
              track(TrackingEvent.CTA_CLICKED, {
                meta: { label: "try_own_analysis_seconds", source: "shared_deal_hero", dealId: payload.id },
              });
            }}
            className="inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_12px_40px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
          >
            Try your own analysis in seconds
          </Link>
          <p className="text-xs text-slate-500">Free · No account required to run numbers</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 sm:text-sm">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
            Used by real estate investors
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">AI-powered insights</span>
          <HintTooltip label="Enter price, rent, and expenses to see results instantly" side="inline">
            <span className="text-slate-400">Quick start</span>
          </HintTooltip>
        </div>
        <div className="mt-6 flex justify-center">
          <ShareDealButton dealId={payload.id} shareVariant="live" />
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-center text-sm text-amber-100 sm:px-6">
        <strong className="text-amber-200">Start analyzing deals in seconds</strong> — no experience required.
      </div>

      {payload.mode === "dual" ? (
        <section className="mt-10 space-y-4" aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="text-lg font-semibold text-white">
            Long-term vs short-term results
          </h2>
          <p className="text-sm text-slate-500">
            {payload.city} · {formatCurrencyCAD(payload.propertyPrice)} · expenses {formatCurrencyCAD(payload.monthlyExpenses)}/mo
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-2xl border p-5 ${
                !stWins ? "border-emerald-500/60 bg-emerald-950/25 ring-2 ring-emerald-500/40" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Long-term rental</h3>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{formatRoiPercent(payload.dual.roiLongTerm)}</p>
              <p className="text-xs text-slate-500">Cash-on-cash ROI</p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Monthly CF</dt>
                  <dd className="font-mono">{formatCurrencyCAD(payload.dual.monthlyCashFlowLT)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Annual CF</dt>
                  <dd className="font-mono">{formatCurrencyCAD(payload.dual.annualCashFlowLT)}</dd>
                </div>
              </dl>
            </div>
            <div
              className={`rounded-2xl border p-5 ${
                stWins ? "border-emerald-500/60 bg-emerald-950/25 ring-2 ring-emerald-500/40" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Short-term rental</h3>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{formatRoiPercent(payload.dual.roiShortTerm)}</p>
              <p className="text-xs text-slate-500">Cash-on-cash ROI</p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Est. monthly revenue</dt>
                  <dd className="font-mono">{formatCurrencyCAD(payload.dual.monthlyRevenueShortTerm)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Monthly CF</dt>
                  <dd className="font-mono">{formatCurrencyCAD(payload.dual.monthlyCashFlowST)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Annual CF</dt>
                  <dd className="font-mono">{formatCurrencyCAD(payload.dual.annualCashFlowST)}</dd>
                </div>
              </dl>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-emerald-300">
            {stWins ? "Short-term shows higher ROI on these assumptions." : "Long-term shows stronger or more stable returns on these assumptions."}
          </p>
        </section>
      ) : payload.mode === "dual_stored" ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Long-term vs short-term results</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-2xl border p-5 ${
                !stWins ? "border-emerald-500/60 bg-emerald-950/25 ring-2 ring-emerald-500/40" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase text-slate-300">Long-term</h3>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{formatRoiPercent(payload.roiLongTerm)}</p>
              <p className="text-xs text-slate-500">ROI (saved analysis)</p>
            </div>
            <div
              className={`rounded-2xl border p-5 ${
                stWins ? "border-emerald-500/60 bg-emerald-950/25 ring-2 ring-emerald-500/40" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase text-slate-300">Short-term</h3>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{formatRoiPercent(payload.roiShortTerm)}</p>
              <p className="text-xs text-slate-500">ROI (saved analysis)</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Preferred view: <strong className="text-slate-300">{rentalTypeLabel(payload.preferredStrategy)}</strong>
          </p>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Analysis snapshot</h2>
          <p className="mt-2 text-sm text-slate-500">
            {payload.city} · {rentalTypeLabel(payload.rentalType)} assumptions
          </p>
          <p className="mt-4 font-mono text-4xl font-bold text-emerald-400">{formatRoiPercent(payload.roi)}</p>
          <p className="text-xs text-slate-500">Cash-on-cash ROI (illustrative)</p>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-emerald-500/35 bg-emerald-950/20 px-5 py-8 text-center sm:px-8">
        <h2 className="text-xl font-bold text-white">Try your own analysis in seconds</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Run the same long-term vs short-term comparison on your numbers — free, in your browser.
        </p>
        <Link
          href="/analyze#analyzer"
          onClick={trackAnalyzeClick}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 px-8 py-3 text-base font-bold text-slate-950 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400"
        >
          Start analyzing now
        </Link>
        <p className="mt-4 text-xs text-slate-500">
          Opens the investment analyzer — no account required for the demo.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Get similar deal insights</h3>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email to get similar deal insights and product updates. Unsubscribe anytime.
        </p>
        <form onSubmit={onWaitlistSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="shared-deal-email">
            Enter your email to get similar deal insights
          </label>
          <input
            id="shared-deal-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to get similar deal insights"
            className="min-h-[48px] flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            disabled={waitStatus === "loading"}
            className="min-h-[48px] shrink-0 rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-60"
          >
            {waitStatus === "loading" ? "Sending…" : "Send me insights"}
          </button>
        </form>
        {waitMessage ? (
          <p role="status" className={`mt-3 text-sm ${waitStatus === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {waitMessage}
          </p>
        ) : null}
      </section>

      <GeneratedByLecipm className="mt-12 border-t border-white/10 pt-8" />
    </main>
    </>
  );
}
