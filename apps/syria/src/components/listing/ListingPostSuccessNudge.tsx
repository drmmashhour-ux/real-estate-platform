"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Wraps share actions after a fresh publish — prominent nudge, then removes `?posted=1` from the URL
 * so refresh does not keep highlighting.
 */
export function ListingPostSuccessNudge({ children }: { children: ReactNode }) {
  const t = useTranslations("Listing");

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("posted") === "1") {
        u.searchParams.delete("posted");
        const q = u.searchParams.toString();
        window.history.replaceState(null, "", u.pathname + (q ? `?${q}` : "") + u.hash);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5">
      <p className="text-sm font-semibold text-emerald-950">{t("afterPostShareTitle")}</p>
      <div className="mt-4 min-w-0 max-w-full">{children}</div>
    </div>
  );
}
