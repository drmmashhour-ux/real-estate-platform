"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/**
 * Top success strip when `?posted=1` — not a modal. Dismiss removes `posted` from the URL.
 */
export function PostSuccessTopBanner() {
  const t = useTranslations("Listing");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (searchParams.get("posted") !== "1") return null;

  const onDismiss = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("posted");
    const q = p.toString();
    void router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-amber-50/90 p-4 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 [dir:rtl]:flex-row-reverse">
        <p className="text-base font-bold leading-snug text-emerald-950 sm:text-lg">{t("postSuccessBanner")}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-semibold text-emerald-800/90 underline decoration-emerald-600/50 underline-offset-2 hover:text-emerald-950"
        >
          {t("postSuccessDismiss")}
        </button>
      </div>
    </div>
  );
}
