"use client";

import { useTranslations } from "next-intl";
import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";
import { trackListingContactClick } from "@/lib/contact-analytics-client";
import { Card } from "@/components/ui/Card";
import { ListingShareActions } from "@/components/listing/ListingShareActions";

export function ListingOwnerContactCard({
  listingId,
  waOwnerHref,
  telOwnerHref,
  canContact,
  ownerHasPhone,
  primaryHeading,
  shareTitle,
  sharePriceLine,
  shareCity,
  sharePriceAmount,
  adCode,
}: {
  listingId: string;
  waOwnerHref: string | null;
  telOwnerHref: string | null;
  canContact: boolean;
  ownerHasPhone: boolean;
  /** SYBNB-11: single headline (e.g. contact the owner). */
  primaryHeading?: string | null;
  shareTitle?: string;
  sharePriceLine?: string;
  shareCity?: string;
  sharePriceAmount?: number;
  adCode?: string;
}) {
  const t = useTranslations("Listing");
  return (
    <Card className="border-[color:var(--darlink-border)] p-4 shadow-[var(--darlink-shadow-sm)]">
      {ownerHasPhone ? (
        primaryHeading ? (
          <>
            <p className="text-center text-base font-semibold tracking-tight text-[color:var(--darlink-text)]">{primaryHeading}</p>
            <p className="mt-1 text-center text-[11px] text-[color:var(--darlink-text-muted)]">{t("trustVerifyPayment")}</p>
          </>
        ) : (
          <>
            <p className="text-center text-xs font-semibold text-amber-900/95">{t("contactUrgency")}</p>
            <p className="mt-0.5 text-center text-[11px] text-[color:var(--darlink-text-muted)]">{t("trustVerifyPayment")}</p>
          </>
        )
      ) : (
        <p className="text-sm text-amber-800">{t("contactNoPhone")}</p>
      )}
      {canContact && waOwnerHref ? (
        <a
          href={waOwnerHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackListingContactClick(listingId, "whatsapp");
            trackLeadWhatsappClick(listingId);
          }}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-xl bg-[#25D366] px-4 text-base font-bold text-white shadow-md hover:bg-[#20bd5a]"
        >
          {t("contactWhatsapp")}
        </a>
      ) : null}
      {canContact && telOwnerHref ? (
        <a
          href={telOwnerHref}
          onClick={() => {
            trackListingContactClick(listingId, "tel");
            trackLeadPhoneClick(listingId);
          }}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-4 text-sm font-bold text-[color:var(--darlink-navy)]"
        >
          {t("contactCall")}
        </a>
      ) : null}
      {shareTitle && sharePriceLine ? (
        <div className="mt-3 min-w-0 border-t border-[color:var(--darlink-border)] pt-3 [overflow-wrap:anywhere]">
          <ListingShareActions
            listingId={listingId}
            shareTitle={shareTitle}
            sharePriceLine={sharePriceLine}
            shareCity={shareCity}
            sharePriceAmount={sharePriceAmount}
            adCode={adCode}
          />
        </div>
      ) : null}
    </Card>
  );
}
