"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trackListingPhoneReveal } from "@/lib/contact-analytics-client";
import { onlyDigits } from "@/lib/syria-phone";
import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";
import { trackListingContactClick } from "@/lib/contact-analytics-client";
import { ListingReportForm } from "@/components/listing/ListingReportForm";
import { ListingSellerMessageForm } from "@/components/listing/ListingSellerMessageForm";
import { SybnbReportListingForm } from "@/components/sybnb/SybnbReportListingForm";

/**
 * Phone reveal + optional channels + report. Stay listings use SYBNB report API + thresholds.
 * ORDER SYBNB-92 — seller toggles phone / WhatsApp / email / on-platform messages.
 */
export function ListingTrustPanel({
  listingId,
  phoneRaw,
  isOwner,
  isSybnbStay = false,
  canReport = true,
  whatsappHref,
  telHref,
  mailtoHref,
  allowPhone,
  allowMessages,
}: {
  listingId: string;
  phoneRaw: string;
  isOwner: boolean;
  /** When true, guest report goes to `POST /api/sybnb/.../report` (`ListingReport` / `sybnb_listing_reports`). */
  isSybnbStay?: boolean;
  /** Signed-in non-owner; when false, Sybnb report is hidden. */
  canReport?: boolean;
  /** Non-null when seller allows WhatsApp — computed on the server page. */
  whatsappHref: string | null;
  telHref: string | null;
  mailtoHref: string | null;
  allowPhone: boolean;
  allowMessages: boolean;
}) {
  const t = useTranslations("Listing");
  const [revealed, setRevealed] = useState(false);
  const digits = onlyDigits(phoneRaw.trim());
  const hasPhone = digits.length >= 8;

  return (
    <section className="max-w-full min-w-0 space-y-4 overflow-x-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-5 shadow-[var(--darlink-shadow-sm)]">
      <p className="text-[11px] leading-relaxed text-[color:var(--darlink-text-muted)] [dir=rtl]:text-right">
        {t("contactSafetyHint")}
      </p>

      {!isOwner && whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackListingContactClick(listingId, "whatsapp");
            trackLeadWhatsappClick(listingId);
          }}
          className="flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[#25D366] px-4 text-sm font-bold text-white shadow-md hover:bg-[#20bd5a]"
        >
          {t("contactWhatsapp")}
        </a>
      ) : null}

      {!isOwner && allowPhone && hasPhone ? (
        <div className="min-w-0 space-y-2">
          {revealed ? (
            <div className="min-w-0 break-words">
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-wide text-[color:var(--darlink-text)]" dir="ltr">
                {phoneRaw.trim()}
              </p>
              {telHref ? (
                <a
                  href={telHref}
                  onClick={() => {
                    trackListingContactClick(listingId, "tel");
                    trackLeadPhoneClick(listingId);
                  }}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-4 text-sm font-semibold text-[color:var(--darlink-navy)]"
                >
                  {t("contactCall")}
                </a>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="w-full min-h-11 rounded-md bg-[color:var(--darlink-surface-muted)] px-3 py-2.5 text-sm font-medium text-[color:var(--darlink-text)] ring-1 ring-inset ring-[color:var(--darlink-border)] sm:w-auto"
              onClick={() => {
                trackListingPhoneReveal(listingId);
                setRevealed(true);
              }}
            >
              {t("showPhone")}
            </button>
          )}
        </div>
      ) : null}

      {!isOwner && mailtoHref ? (
        <a
          href={mailtoHref}
          className="flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] px-4 text-sm font-semibold text-[color:var(--darlink-text)] hover:bg-[color:var(--darlink-surface)]"
        >
          {t("contactEmail")}
        </a>
      ) : null}

      {!isOwner && allowMessages ? (
        <div id="listing-message-form">
          <ListingSellerMessageForm propertyId={listingId} />
        </div>
      ) : null}

      {isSybnbStay ? (
        <SybnbReportListingForm
          propertyId={listingId}
          variant="section"
          disabled={isOwner || !canReport}
        />
      ) : (
        <ListingReportForm propertyId={listingId} disabled={isOwner || !canReport} />
      )}
    </section>
  );
}
