"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
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
        successUrl: `${origin}/billing/workspace-subscription/success?session_id={CHECKOUT_SESSION_ID}`,
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
    <div className="inline-flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={() => void handleUpgrade()}
        disabled={loading}
        className={
          className ??
          "rounded-xl bg-premium-gold px-4 py-2 font-semibold text-black transition-all duration-150 hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] active:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]/65 disabled:pointer-events-none disabled:opacity-60 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:active:scale-100"
        }
      >
        {loading ? "Loading..." : "Upgrade"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Lock className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
        <span>Secure checkout via Stripe</span>
      </p>
    </div>
  );
}
