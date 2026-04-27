"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trackClientAnalyticsEvent } from "@/lib/client-analytics";
import type { F1PlanKey } from "@/lib/payment-f1";

type Contact = { displayPhone: string; whatsappHref: string | null; telHref: string | null } | null;

/**
 * One-tap F1: POST payment request and open WhatsApp — no modal (used for inline upgrade nudges).
 */
export function WhatsappPayUpgradeButton({
  listingId,
  plan = "featured",
  contact,
  className,
  children,
}: {
  listingId: string;
  plan?: F1PlanKey;
  contact: Contact;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Listing");
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading || !contact}
      className={className}
      title={!contact ? t("makeFeaturedNoAdminPhone") : undefined}
      onClick={() => {
        if (!contact) return;
        setLoading(true);
        void (async () => {
          try {
            const res = await fetch("/api/payments/request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ listingId, plan }),
            });
            const data = (await res.json()) as { ok?: boolean; whatsappUrl?: string; error?: string };
            if (!res.ok || !data.ok || typeof data.whatsappUrl !== "string") {
              return;
            }
            trackClientAnalyticsEvent("f1_payment_request", { propertyId: listingId, payload: { plan, listingId, source: "inline_nudge" } });
            trackClientAnalyticsEvent("whatsapp_clicked", { propertyId: listingId, payload: { listingId, plan, source: "inline_nudge" } });
            window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
