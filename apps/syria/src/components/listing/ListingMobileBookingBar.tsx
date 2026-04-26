"use client";

import { useTranslations } from "next-intl";
import { money } from "@/lib/format";

/** Fixed bottom bar on small screens — price + jump to booking. */
export function ListingMobileBookingBar({
  amount,
  currency,
  numberLoc,
}: {
  amount: { toString(): string };
  currency: string;
  numberLoc: string;
}) {
  const t = useTranslations("Listing");
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]/95 px-4 py-3 shadow-[var(--darlink-shadow-lg)] backdrop-blur-md md:hidden">
      <div className="darlink-rtl-row mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="text-lg font-bold tabular-nums text-[color:var(--darlink-text)]">{money(amount, currency, numberLoc)}</p>
        <a
          href="#darlink-booking"
          className="hadiah-btn-primary inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--darlink-radius-xl)] px-5 py-2.5 text-sm font-semibold"
        >
          {t("mobileBookCta")}
        </a>
      </div>
    </div>
  );
}
