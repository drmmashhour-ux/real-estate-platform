"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPricing } from "@/modules/monetization/pricing.config";
import type { RevenueLoopForLeadDto } from "@/modules/monetization/revenue-loop.types";

type Api = { ok: boolean; data?: RevenueLoopForLeadDto; error?: string };

const P = getPricing().premiumSubscriptionMonthly;

/**
 * Value-first upsell: similar leads, real engagement signals, optional Pro teaser. No fake inventory counts.
 */
export function RevenueLoopLeadStrip({ leadId, show }: { leadId: string; show: boolean }) {
  const [d, setD] = useState<RevenueLoopForLeadDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const load = useCallback(() => {
    if (!show) return;
    void fetch(`/api/monetization/revenue-loop?leadId=${encodeURIComponent(leadId)}`, { credentials: "include" })
      .then((r) => r.json() as Promise<Api>)
      .then((j) => {
        if (j.ok && j.data) setD(j.data);
        else setErr(j.error ?? "unavailable");
      })
      .catch(() => setErr("network"));
  }, [leadId, show]);

  useEffect(() => {
    load();
  }, [load]);

  const startProCheckout = async () => {
    setSubLoading(true);
    try {
      const r = await fetch("/api/subscription/broker/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "pro" }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      setErr(j.error ?? "Checkout unavailable");
    } catch {
      setErr("Checkout failed");
    } finally {
      setSubLoading(false);
    }
  };

  if (!show) return null;
  if (err && !d) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-[#141414] p-3 text-xs text-slate-500" role="note">
        Suggestions unavailable ({err}).
      </div>
    );
  }
  if (!d) {
    return (
      <div className="mt-4 rounded-xl border border-white/5 bg-[#0f0f0f] p-3 text-xs text-slate-500">Loading ideas…</div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {d.urgency.isRecentlyAdded ? (
        <p className="text-xs text-amber-200/90">
          <span className="font-semibold text-amber-300/90">Recently added</span> (this lead arrived in the last {7} days).
        </p>
      ) : null}
      {d.urgency.showEngagedBrokers ? (
        <p className="text-xs text-slate-300">
          <span className="font-semibold text-slate-100">
            {d.urgency.engagedBrokersInWindow} brokers
          </span>{" "}
          logged CRM activity on this lead in the last {d.urgency.windowHours} hours (from platform CRM events — not
          &quot;live viewers&quot;).
        </p>
      ) : null}
      {d.urgency.regionPeerLeadCount != null && d.urgency.regionPeerLeadCount > 0 ? (
        <p className="text-xs text-slate-500">
          Regional activity signal: {d.urgency.regionPeerLeadCount} other lead
          {d.urgency.regionPeerLeadCount === 1 ? "" : "s"} in the same region in the last 30 days.
        </p>
      ) : null}

      {d.similarLeads.length > 0 ? (
        <div className="rounded-xl border border-premium-gold/25 bg-gradient-to-b from-[#1a1508] to-[#0f0f0f] p-4">
          <p className="text-sm font-semibold text-premium-gold">More leads like this</p>
          <p className="mt-1 text-xs text-slate-400">Available on the lead marketplace, matched by region and quality score.</p>
          <ul className="mt-3 space-y-2">
            {d.similarLeads.map((s) => (
              <li
                key={s.listingId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              >
                <span className="text-sm text-slate-200">Score {s.score}</span>
                <span className="text-xs text-slate-500">{s.region ?? "Region n/a"}</span>
                <span className="text-sm font-medium text-slate-100">from ${s.priceCad} CAD</span>
                <Link
                  href={s.href}
                  className="ml-auto text-xs font-semibold text-premium-gold hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/expert/marketplace"
            className="mt-3 inline-block text-xs text-premium-gold/90 hover:underline"
          >
            Open lead marketplace →
          </Link>
        </div>
      ) : null}

      {d.showBulkBundleHint ? (
        <div className="rounded-xl border border-white/10 bg-[#111] p-4 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">Bundle pricing (transparent)</p>
          <p className="mt-1 text-slate-500">
            Buy {d.bundleProgress.target} qualifying lead purchases in a {d.bundleProgress.windowDays}-day window and
            get {d.bundleProgress.discountPercent}% off the third (when enabled at checkout). Progress in this
            window: {d.bundleProgress.current} / {d.bundleProgress.target} toward the cycle.{" "}
            <span className="text-slate-600">Exact totals always shown before you pay in Stripe.</span>
          </p>
        </div>
      ) : null}

      {d.showPremiumTeaser ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <p className="text-sm font-semibold text-emerald-200/90">Broker Pro (from ${P}/mo, CAD — catalog)</p>
          <ul className="mt-2 list-inside list-disc text-xs text-slate-300">
            {d.premiumBenefits.map((b) => (
              <li key={b.slice(0, 40)}>{b}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">{d.disclaimer}</p>
          <button
            type="button"
            onClick={startProCheckout}
            disabled={subLoading}
            className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {subLoading ? "Redirecting…" : `View Pro checkout (≈$${P}/mo + tax)`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
