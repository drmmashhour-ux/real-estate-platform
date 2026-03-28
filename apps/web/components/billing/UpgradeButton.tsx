"use client";

import { useState } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/trackEvent";

type Props = {
  planCode?: string;
  workspaceId?: string;
  className?: string;
};

/**
 * Starts LECIPM workspace subscription Checkout (see POST /api/stripe/checkout with
 * paymentType `lecipm_workspace_subscription`). Returns `{ url }` — not `checkoutUrl`.
 */
export function UpgradeButton({ planCode = "pro", workspaceId, className }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    trackEvent(AnalyticsEvents.UPGRADE_CLICKED, { plan: planCode, workspaceId: workspaceId ?? null });

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentType: "lecipm_workspace_subscription",
        planCode,
        successUrl: `${origin}/dashboard?success=1`,
        cancelUrl: `${origin}/dashboard?canceled=1`,
        ...(workspaceId ? { workspaceId } : {}),
      }),
    });

    const data = (await res.json()) as { url?: string; error?: string };

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    alert(data.error ?? "Unable to start checkout");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={() => void handleUpgrade()}
      disabled={loading}
      className={
        className ??
        "rounded-lg bg-premium-gold px-4 py-2 font-semibold text-black disabled:opacity-60"
      }
    >
      {loading ? "Loading..." : "Upgrade"}
    </button>
  );
}
