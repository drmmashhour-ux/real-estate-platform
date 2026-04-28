"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { trackF1FunnelOpenedOnce } from "@/lib/f1-funnel-client";

/**
 * Mobile-only fixed bar — "ترقية الآن" scrolls to inline upgrade (no modal).
 * Parent renders only when the owner R1 path applies.
 */
export function OwnerUpgradeStickyCta({ listingId }: { listingId: string }) {
  const t = useTranslations("Listing");

  useEffect(() => {
    trackF1FunnelOpenedOnce(listingId, "owner_upgrade_sticky");
  }, [listingId]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 max-w-[100vw] border-t border-amber-200/80 bg-amber-50/98 p-2 shadow-[0_-2px_16px_rgba(0,0,0,0.08)] md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <a
        href="#r1-upgrade"
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700"
      >
        {t("bakaUpgradeCta")}
      </a>
    </div>
  );
}
