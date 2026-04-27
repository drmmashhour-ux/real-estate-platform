"use client";

import { useEffect, useState } from "react";

import { continueOnboarding } from "./actions";
import { earlyUserOnboardingHeadline, type EarlyUserSignals } from "@/lib/growth/earlyUserSignalsLogic";
import { trackEvent } from "@/src/services/analytics";
import { cn } from "@/lib/utils";

type Props = {
  /** When false, no API fetch, no FOMO strip (`flags.RECOMMENDATIONS`). */
  recoEnabled: boolean;
};

export function OnboardingView({ recoEnabled }: Props) {
  const [signals, setSignals] = useState<EarlyUserSignals | null>(null);

  useEffect(() => {
    if (!recoEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/growth/early-users", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as EarlyUserSignals;
        if (cancelled) return;
        setSignals(data);
      } catch {
        // Non-blocking: onboarding still works without the strip.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recoEnabled]);

  const bannerText = signals ? earlyUserOnboardingHeadline(signals) : "";
  const showUrgencyBanner = Boolean(bannerText);
  const urgentCta = Boolean(signals && signals.isEarlyPhase && signals.remaining < 20);

  useEffect(() => {
    if (!showUrgencyBanner || !signals) return;
    void trackEvent("early_user_banner_seen", { count: signals.count });
  }, [showUrgencyBanner, signals]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-bold">Get started</h1>

      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Three quick steps to get value from the platform.
      </p>

      {recoEnabled && showUrgencyBanner ? (
        <div
          className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {bannerText}
        </div>
      ) : null}

      <ol className="mt-8 list-decimal space-y-4 pl-5 text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
        <li>Choose your role (Buyer, Seller, Host, Broker)</li>
        <li>Set your preferences</li>
        <li>Explore or create your first listing</li>
      </ol>

      <form action={continueOnboarding} className="mt-10">
        <button
          type="submit"
          onClick={() => {
            void trackEvent("early_user_join_clicked", {});
          }}
          className={cn(
            "rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
            urgentCta &&
              "ring-2 ring-amber-500/80 shadow-md shadow-amber-500/20 animate-pulse dark:ring-amber-400/70"
          )}
        >
          Continue
        </button>
      </form>
    </main>
  );
}
