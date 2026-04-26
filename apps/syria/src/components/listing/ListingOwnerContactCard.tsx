"use client";

import { useTranslations } from "next-intl";
import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";
import { Card } from "@/components/ui/Card";

export function ListingOwnerContactCard({
  listingId,
  waOwnerHref,
  telOwnerHref,
  canContact,
  ownerHasPhone,
}: {
  listingId: string;
  waOwnerHref: string | null;
  telOwnerHref: string | null;
  canContact: boolean;
  ownerHasPhone: boolean;
}) {
  const t = useTranslations("Listing");
  return (
    <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
      {ownerHasPhone ? (
        <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("contactHint")}</p>
      ) : (
        <p className="text-sm text-amber-800">{t("contactNoPhone")}</p>
      )}
      {canContact && waOwnerHref ? (
        <a
          href={waOwnerHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackLeadWhatsappClick(listingId);
          }}
          className="hadiah-btn-primary mt-4 flex w-full min-h-12 items-center justify-center rounded-[var(--darlink-radius-xl)] px-4 py-2.5 text-sm font-semibold"
        >
          {t("contactWhatsapp")}
        </a>
      ) : null}
      {canContact && telOwnerHref ? (
        <a
          href={telOwnerHref}
          onClick={() => {
            trackLeadPhoneClick(listingId);
          }}
          className="mt-2 flex w-full min-h-12 items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--darlink-navy)]"
        >
          {t("contactCall")}
        </a>
      ) : null}
      {ownerHasPhone ? (
        <p className="mt-2 text-xs text-[color:var(--darlink-text-muted)]">{t("contactWhatsappCallHint")}</p>
      ) : null}
    </Card>
  );
}
