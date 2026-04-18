"use client";

import * as React from "react";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export type RevenueUnlockFeatureType = "lead_unlock" | "contact_reveal" | "premium_insight";

type Props = {
  title: string;
  description: string;
  featureType: RevenueUnlockFeatureType;
  /** Required for lead unlock / contact reveal checkout. */
  leadId?: string;
  className?: string;
  primaryLabel?: string;
};

/**
 * Reuses existing Stripe flows: lead unlock → POST `/api/leads/[id]/unlock-checkout`;
 * premium insight → workspace subscription checkout when configured.
 */
export function RevenueUnlockCTA({
  title,
  description,
  featureType,
  leadId,
  className = "",
  primaryLabel,
}: Props) {
  const [busy, setBusy] = React.useState(false);

  const logCtaIntent = React.useCallback(async () => {
    await fetch("/api/revenue/events", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "lead_viewed",
        leadId: leadId ?? null,
        metadata: {
          source: "revenue_unlock_cta",
          featureType,
          ctaIntent: true,
        },
      }),
    }).catch(() => {});
  }, [featureType, leadId]);

  const onPrimary = async () => {
    setBusy(true);
    try {
      await logCtaIntent();
      if (featureType === "lead_unlock" || featureType === "contact_reveal") {
        if (!leadId?.trim()) return;
        const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/unlock-checkout`, {
          method: "POST",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          softBlock?: boolean;
          message?: string;
          error?: string;
        };
        if (data.softBlock) {
          window.alert(data.message ?? "Unlock this lead to continue.");
          return;
        }
        if (!res.ok) {
          window.alert(data.error ?? "Checkout unavailable");
          return;
        }
        if (data.url) window.location.href = data.url;
        return;
      }

      const base = getPublicAppUrl().replace(/\/$/, "");
      const res = await fetch("/api/stripe/workspace-checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: "pro",
          successUrl: `${base}/dashboard/broker?workspace=success`,
          cancelUrl: `${base}/dashboard/broker?workspace=cancel`,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        window.alert(j.error ?? "Subscription checkout unavailable — try again later.");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setBusy(false);
    }
  };

  const label =
    primaryLabel ??
    (featureType === "premium_insight" ? "Upgrade workspace" : "Unlock Lead");

  return (
    <div
      className={`rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 to-[#121212] p-5 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">{title}</p>
      <p className="mt-2 text-sm text-[#D4D4D4]">{description}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onPrimary()}
        className="mt-4 w-full rounded-xl bg-premium-gold px-4 py-2.5 text-sm font-bold text-[#0B0B0B] hover:opacity-95 disabled:opacity-50"
      >
        {busy ? "Working…" : label}
      </button>
      <ul className="mt-4 space-y-1 text-[11px] text-[#9CA3AF]">
        <li>Verified leads</li>
        <li>Secure payment (Stripe)</li>
        <li>No long-term contract</li>
      </ul>
    </div>
  );
}
