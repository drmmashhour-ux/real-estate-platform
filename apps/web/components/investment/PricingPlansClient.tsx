"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { INVESTMENT_FREE_DEAL_LIMIT, PRO_VALUE_LINES } from "@/lib/investment/monetization";
import { track, TrackingEvent, trackPageView } from "@/lib/tracking";
import { UpgradeToProLink } from "@/components/investment/UpgradeToProLink";

/**
 * /pricing — Free vs Pro comparison + mock upgrade (no Stripe yet).
 */
export function PricingPlansClient() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const src = searchParams.get("source") ?? "direct";
    trackPageView(`/pricing?source=${encodeURIComponent(src)}`);
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Investment MVP</p>
      <h1 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">Simple pricing</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
        {PRO_VALUE_LINES.serious} · {PRO_VALUE_LINES.unlock}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Free</h2>
          <p className="mt-2 text-3xl font-bold text-white">
            $0 <span className="text-base font-normal text-slate-500">/ forever</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Basic analysis &amp; ROI estimates
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Run unlimited analyses in the browser
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Up to {INVESTMENT_FREE_DEAL_LIMIT} saved deals (account)
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600">—</span> Demo mode saves locally without limits
            </li>
          </ul>
          <Link
            href="/analyze#analyzer"
            className="mt-8 inline-flex w-full min-h-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Start free
          </Link>
        </section>

        <section className="relative rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/70 to-slate-950 p-6 shadow-[0_0_40px_rgba(16,185,129,0.22)] sm:p-8">
          <h2 className="text-xl font-bold text-white">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-emerald-300">
            Coming soon <span className="text-base font-normal text-slate-400">/ month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Unlimited deal tracking
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Advanced insights &amp; benchmarks
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Full comparison &amp; portfolio features
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span> Priority features as we ship them
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              void track(TrackingEvent.INVESTMENT_UPGRADE_CLICK, {
                meta: { source: "pricing_mock_checkout", cta: "upgrade_to_pro" },
              });
              showToast("Checkout is coming soon — Stripe integration is next. We’ll notify you when Pro is live.", "success");
            }}
            className="mt-8 inline-flex w-full min-h-[52px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-900/35 transition hover:bg-emerald-400"
          >
            Upgrade to Pro
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">No payment required yet — mock flow only.</p>
        </section>
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <UpgradeToProLink source="pricing_footer" className="font-medium text-emerald-400 underline hover:text-emerald-300">
          View upgrade options
        </UpgradeToProLink>{" "}
        ·{" "}
        <Link href="/dashboard" className="text-slate-400 underline hover:text-white">
          Dashboard
        </Link>
      </p>
    </div>
  );
}
