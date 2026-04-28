"use client";

import { useTranslations } from "next-intl";
import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";
import { trackHotelContactClick, trackListingContactClick } from "@/lib/contact-analytics-client";

/**
 * Sticky contact bar (mobile) — WhatsApp / call · SYBNB-11 headline optional.
 */
export function ListingContactDock({
  listingId,
  whatsappHref,
  telHref,
  mailtoHref,
  messageScrollHref,
  primaryHeading,
  contactAnalytics = "listing",
}: {
  listingId: string;
  whatsappHref: string | null;
  telHref: string | null;
  mailtoHref?: string | null;
  /** ORDER SYBNB-95 — scroll target when phone/email channels are off (messaging only). */
  messageScrollHref?: string | null;
  primaryHeading?: string | null;
  /** SYBNB-40 — `hotel_contact_click` vs default `contact_click`. */
  contactAnalytics?: "listing" | "hotel";
}) {
  const t = useTranslations("Listing");
  if (!whatsappHref && !telHref && !mailtoHref && !messageScrollHref) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-14 z-50 max-w-[100vw] border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]/98 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] [overscroll-behavior-x:none] md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto box-border w-full min-w-0 max-w-7xl space-y-1.5 sm:px-0">
        {primaryHeading ? (
          <>
            <p className="px-0.5 text-center text-sm font-semibold text-[color:var(--darlink-text)]">{primaryHeading}</p>
            <p className="px-0.5 text-center text-[11px] leading-snug text-[color:var(--darlink-text-muted)]">{t("trustVerifyPayment")}</p>
            <p className="px-0.5 text-center text-[10px] leading-snug text-[color:var(--darlink-text-muted)]">{t("stickyPaymentAfterConfirm")}</p>
          </>
        ) : (
          <>
            <p className="px-0.5 text-center text-xs font-semibold text-amber-900/95 dark:text-amber-200/95">{t("contactUrgency")}</p>
            <p className="px-0.5 text-center text-[11px] leading-snug text-[color:var(--darlink-text-muted)]">{t("trustVerifyPayment")}</p>
            <p className="px-0.5 text-center text-[10px] leading-snug text-[color:var(--darlink-text-muted)]">{t("stickyPaymentAfterConfirm")}</p>
          </>
        )}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              if (contactAnalytics === "hotel") {
                trackHotelContactClick(listingId, "whatsapp");
              } else {
                trackListingContactClick(listingId, "whatsapp");
              }
              trackLeadWhatsappClick(listingId);
            }}
            className="flex h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-[#25D366] px-4 text-base font-bold text-white shadow-md transition hover:bg-[#20bd5a] active:scale-[0.99]"
          >
            {t("contactWhatsapp")}
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            onClick={() => {
              if (contactAnalytics === "hotel") {
                trackHotelContactClick(listingId, "tel");
              } else {
                trackListingContactClick(listingId, "tel");
              }
              trackLeadPhoneClick(listingId);
            }}
            className="flex h-12 w-full touch-manipulation items-center justify-center rounded-xl border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-4 text-sm font-bold text-[color:var(--darlink-navy)]"
          >
            {t("contactCall")}
          </a>
        ) : null}
        {mailtoHref ? (
          <a
            href={mailtoHref}
            className="flex h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] px-4 text-sm font-semibold text-[color:var(--darlink-text)]"
          >
            {t("contactEmail")}
          </a>
        ) : null}
        {messageScrollHref ? (
          <a
            href={messageScrollHref}
            className="flex h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-[color:var(--darlink-navy)] px-4 text-base font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
          >
            {t("contactMessageSend")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
