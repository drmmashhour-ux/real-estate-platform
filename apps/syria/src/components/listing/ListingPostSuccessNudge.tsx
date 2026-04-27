"use client";

import { type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
  /**
   * When set on the listing page, the block hides after `?posted=1` is removed (dismiss or navigation).
   * Leave unset on e.g. quick-post success, where the URL has no `posted` param.
   */
  urlGated?: boolean;
};

/**
 * Prominent after-publish share CTA (inline, not a modal). Pair with `PostSuccessTopBanner` on the listing page.
 */
export function ListingPostSuccessNudge({ children, urlGated }: Props) {
  const t = useTranslations("Listing");
  const searchParams = useSearchParams();
  if (urlGated && searchParams.get("posted") !== "1") return null;

  return (
    <div className="mt-4 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-emerald-50/95 to-white p-4 shadow-md ring-1 ring-emerald-100/60 sm:mt-5 sm:p-5">
      <p className="text-base font-bold text-emerald-950">{t("afterPostShareTitle")}</p>
      <p className="mt-1 text-sm text-emerald-900/90">{t("afterPostShareTagline")}</p>
      <div className="mt-4 min-w-0 max-w-full">{children}</div>
      <p className="mt-3 text-xs leading-relaxed text-emerald-900/80">{t("afterPostShareReferral")}</p>
    </div>
  );
}
