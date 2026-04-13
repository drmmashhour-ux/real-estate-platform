"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HostStripeConnectCta } from "@/components/host/HostStripeConnectCta";

type StripeState = {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
};

export function HostPayoutsClient({
  initialStripe,
  commissionPercentLabel,
}: {
  initialStripe: StripeState;
  commissionPercentLabel: string;
}) {
  const [onboardingComplete, setOnboardingComplete] = useState(
    Boolean(initialStripe.stripeOnboardingComplete)
  );

  useEffect(() => {
    setOnboardingComplete(Boolean(initialStripe.stripeOnboardingComplete));
  }, [initialStripe.stripeOnboardingComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "1" || p.get("stripe_connect") === "refresh") {
      fetch("/api/stripe/connect/status", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d: { onboardingComplete?: boolean }) => {
          if (typeof d.onboardingComplete === "boolean") setOnboardingComplete(d.onboardingComplete);
        })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", "/dashboard/host/payouts");
        });
    }
  }, []);

  const payoutBlocked = !onboardingComplete;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Stripe Connect payouts</h2>
      <p className="mt-1 text-sm text-slate-400">
        Guest payments are split automatically: BNHUB keeps a <strong>{commissionPercentLabel}</strong>{" "}
        platform fee; the remainder is transferred to your connected Stripe account. Complete onboarding
        on Stripe (test or live) using the button below — accounts are created via our platform API, not
        manually in the Stripe Dashboard.
      </p>
      {payoutBlocked && (
        <p className="mt-3 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
          <strong>Payout blocked:</strong> complete Stripe setup to accept paid bookings. Guests will see
          a host payout error until onboarding shows as complete.
        </p>
      )}
      <div className="mt-4">
        <HostStripeConnectCta
          initialHasAccount={Boolean(initialStripe.stripeAccountId)}
          initialOnboardingComplete={onboardingComplete}
          showSetupButton
          onOnboardingChange={setOnboardingComplete}
        />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        <Link href="/bnhub/host/dashboard" className="text-emerald-400 hover:text-emerald-300">
          ← Back to BNHUB host dashboard
        </Link>
      </p>
    </div>
  );
}
