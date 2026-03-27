"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
  const [connected, setConnected] = useState(Boolean(initialStripe.stripeAccountId));
  const [onboardingComplete, setOnboardingComplete] = useState(
    Boolean(initialStripe.stripeOnboardingComplete)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnected(Boolean(initialStripe.stripeAccountId));
    setOnboardingComplete(Boolean(initialStripe.stripeOnboardingComplete));
  }, [initialStripe.stripeAccountId, initialStripe.stripeOnboardingComplete]);

  const syncStatus = useCallback(() => {
    return fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((d: { connected?: boolean; onboardingComplete?: boolean }) => {
        if (typeof d.connected === "boolean") setConnected(d.connected);
        if (typeof d.onboardingComplete === "boolean") setOnboardingComplete(d.onboardingComplete);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "1" || p.get("stripe_connect") === "refresh") {
      void syncStatus().finally(() => {
        window.history.replaceState({}, "", "/dashboard/host/payouts");
      });
    }
  }, [syncStatus]);

  async function startOnboard() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start Stripe onboarding");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const payoutBlocked = !onboardingComplete;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Stripe Connect payouts</h2>
      <p className="mt-1 text-sm text-slate-400">
        Guest payments are split automatically: BNHub keeps a <strong>{commissionPercentLabel}</strong>{" "}
        platform fee; the remainder is transferred to your connected Stripe account. Manual host payouts
        are not used when Connect is active.
      </p>
      {payoutBlocked && (
        <p className="mt-3 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
          <strong>Payout blocked:</strong> complete Stripe onboarding to accept paid bookings. Guests will
          see &quot;Host not ready to receive payments&quot; until this is done.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onboardingComplete ? (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300">
            Account connected — ready for payouts
          </span>
        ) : connected ? (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
            Finish Stripe setup
          </span>
        ) : (
          <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">Not connected</span>
        )}
        {!onboardingComplete && (
          <button
            type="button"
            onClick={() => void startOnboard()}
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Opening Stripe…" : "Connect Stripe account"}
          </button>
        )}
        <button
          type="button"
          onClick={() => void syncStatus()}
          className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Refresh status
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      <p className="mt-4 text-xs text-slate-500">
        <Link href="/bnhub/host/dashboard" className="text-emerald-400 hover:text-emerald-300">
          ← Back to BNHub host dashboard
        </Link>
      </p>
    </div>
  );
}
