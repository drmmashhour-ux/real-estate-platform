"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buildTelHref, buildWhatsAppContactHref, onlyDigits } from "@/lib/syria-phone";
import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";
import { ListingReportForm } from "@/components/listing/ListingReportForm";
import { SybnbReportListingForm } from "@/components/sybnb/SybnbReportListingForm";

/**
 * Phone reveal + report. Stay listings use SYBNB report API + thresholds.
 */
export function ListingTrustPanel({
  listingId,
  phoneRaw,
  isOwner,
  isSybnbStay = false,
  canReport = true,
}: {
  listingId: string;
  phoneRaw: string;
  isOwner: boolean;
  /** When true, guest report goes to `POST /api/sybnb/.../report` (SybnbListingReport). */
  isSybnbStay?: boolean;
  /** Signed-in non-owner; when false, Sybnb report is hidden. */
  canReport?: boolean;
}) {
  const t = useTranslations("Listing");
  const [revealed, setRevealed] = useState(false);
  const digits = onlyDigits(phoneRaw.trim());
  const hasPhone = digits.length >= 8;
  const wa = hasPhone ? buildWhatsAppContactHref(phoneRaw) : null;
  const tel = hasPhone ? buildTelHref(phoneRaw) : null;

  return (
    <section className="max-w-full min-w-0 space-y-4 overflow-x-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-5 shadow-[var(--darlink-shadow-sm)]">
      {hasPhone ? (
        <div className="min-w-0 space-y-2">
          {isOwner || revealed ? (
            <div className="min-w-0 break-words">
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-wide text-[color:var(--darlink-text)]" dir="ltr">
                {phoneRaw.trim()}
              </p>
              {!isOwner && wa && tel ? (
                <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      trackLeadWhatsappClick(listingId);
                    }}
                    className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-accent)] px-3 text-center text-sm font-semibold text-white"
                  >
                    {t("contactWhatsapp")}
                  </a>
                  <a
                    href={tel}
                    onClick={() => {
                      trackLeadPhoneClick(listingId);
                    }}
                    className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-3 text-center text-sm font-semibold text-[color:var(--darlink-navy)]"
                  >
                    {t("contactCall")}
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="w-full min-h-11 rounded-md bg-[color:var(--darlink-surface-muted)] px-3 py-2.5 text-sm font-medium text-[color:var(--darlink-text)] ring-1 ring-inset ring-[color:var(--darlink-border)] sm:w-auto"
              onClick={() => setRevealed(true)}
            >
              {t("showPhone")}
            </button>
          )}
        </div>
      ) : null}
      {isSybnbStay ? (
        <SybnbReportListingForm
          propertyId={listingId}
          variant="section"
          disabled={isOwner || !canReport}
        />
      ) : (
        <ListingReportForm propertyId={listingId} disabled={isOwner} />
      )}
    </section>
  );
}
