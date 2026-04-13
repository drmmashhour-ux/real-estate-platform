"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  HUB_DISPLAY_NAME,
  isValidPlanSelection,
  resolvePlanLabel,
  type BillingPeriod,
} from "@/lib/pricing/public-catalog";

const STORAGE_KEY = "platformPricingSelection";

export function CheckoutPlanClient() {
  const searchParams = useSearchParams();
  const hub = searchParams.get("hub");
  const plan = searchParams.get("plan");
  const billing = (searchParams.get("billing") as BillingPeriod | null) ?? "monthly";

  const valid = isValidPlanSelection(hub, plan);
  const billingSafe: BillingPeriod = billing === "yearly" ? "yearly" : "monthly";

  const snapshot = useMemo(
    () => ({ hub, plan, billing: billingSafe, savedAt: Date.now() }),
    [hub, plan, billingSafe]
  );

  useEffect(() => {
    if (!valid || !hub || !plan) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* ignore quota / private mode */
    }
  }, [valid, hub, plan, snapshot]);

  if (!valid || !hub || !plan) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-semibold text-white">Select a plan</h1>
        <p className="mt-3 text-sm text-slate-400">
          This checkout link is incomplete. Choose a plan from the pricing page first.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-premium-gold to-[#a88a2e] px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
        >
          View pricing
        </Link>
      </div>
    );
  }

  const planName = resolvePlanLabel(hub, plan) ?? plan;
  const hubName = HUB_DISPLAY_NAME[hub];

  const nextBilling = `/dashboard/billing`;
  const registerHref = `/auth/register?next=${encodeURIComponent(nextBilling)}`;
  const loginHref = `/auth/login?next=${encodeURIComponent(nextBilling)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-20">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-premium-gold/90">Checkout</p>
      <h1 className="mt-2 text-center font-serif text-2xl font-semibold text-white sm:text-3xl">
        Confirm your plan
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        We&apos;ve saved your selection to this browser. Complete account setup to activate billing when available.
      </p>

      <div className="mt-10 rounded-2xl border border-premium-gold/30 bg-gradient-to-b from-premium-gold/10 to-black/40 p-6 text-left">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Hub</dt>
            <dd className="font-medium text-white">{hubName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-medium text-premium-gold">{planName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Billing</dt>
            <dd className="font-medium text-white capitalize">{billingSafe}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={registerHref}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-premium-gold via-[#d4b45c] to-[#a88a2e] px-5 py-3.5 text-center text-sm font-semibold text-black shadow-lg shadow-premium-gold/20 hover:brightness-110"
        >
          Create account &amp; continue
        </Link>
        <Link
          href={loginHref}
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white hover:border-premium-gold/40 hover:bg-white/5"
        >
          Sign in
        </Link>
        <Link href="/pricing" className="pt-2 text-center text-sm text-slate-500 hover:text-premium-gold">
          ← Back to pricing
        </Link>
      </div>
    </div>
  );
}
