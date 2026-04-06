"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  initialHasAccount: boolean;
  initialOnboardingComplete: boolean;
  /** When false, only show status (e.g. compact hub banner). */
  showSetupButton?: boolean;
  className?: string;
  onOnboardingChange?: (complete: boolean) => void;
};

/**
 * BNHub host: API-only Connect onboarding (create-account → create-account-link → Stripe-hosted flow).
 */
export function HostStripeConnectCta({
  initialHasAccount,
  initialOnboardingComplete,
  showSetupButton = true,
  className = "",
  onOnboardingChange,
}: Props) {
  const [onboardingComplete, setOnboardingComplete] = useState(initialOnboardingComplete);
  const [hasAccount] = useState(initialHasAccount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOnboardingComplete(initialOnboardingComplete);
  }, [initialOnboardingComplete]);

  const syncStatus = useCallback(() => {
    return fetch("/api/stripe/connect/status", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { onboardingComplete?: boolean }) => {
        if (typeof d.onboardingComplete === "boolean") {
          setOnboardingComplete(d.onboardingComplete);
          onOnboardingChange?.(d.onboardingComplete);
        }
      })
      .catch(() => {});
  }, [onOnboardingChange]);

  async function completeStripeSetup() {
    setError(null);
    setLoading(true);
    try {
      const createRes = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
        credentials: "same-origin",
      });
      const createData = (await createRes.json()) as { error?: string; accountId?: string };
      if (!createRes.ok) {
        setError(createData.error ?? "Could not create connected account");
        return;
      }
      const linkRes = await fetch("/api/stripe/connect/create-account-link", {
        method: "POST",
        credentials: "same-origin",
      });
      const linkData = (await linkRes.json()) as { error?: string; url?: string };
      if (!linkRes.ok) {
        setError(linkData.error ?? "Could not start Stripe onboarding");
        return;
      }
      if (linkData.url) window.location.href = linkData.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {onboardingComplete ? (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300">
            Stripe connected ✅
          </span>
        ) : hasAccount ? (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
            Finish Stripe setup
          </span>
        ) : (
          <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">Stripe payouts not set up</span>
        )}
        {showSetupButton && !onboardingComplete && (
          <button
            type="button"
            onClick={() => void completeStripeSetup()}
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Opening Stripe…" : "Complete Stripe setup"}
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
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
