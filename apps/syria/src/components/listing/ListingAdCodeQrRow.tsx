"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { QRModal } from "@/components/QRModal";
import { getListingPath } from "@/lib/syria/listing-share";

/**
 * SY-29: Ad number + optional QR trigger. No QR work until the user clicks.
 */
export function ListingAdCodeQrRow({ listingId, adCode }: { listingId: string; adCode: string }) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");

  function openModal() {
    if (typeof window === "undefined") return;
    const path = getListingPath(locale, listingId);
    setTargetUrl(new URL(path, window.location.origin).href);
    setModalOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 [dir:rtl]:flex-row-reverse">
        <p className="text-sm font-semibold tabular-nums text-[color:var(--darlink-text)] [dir:ltr]">
          {t("adCodeLine", { code: adCode })}
        </p>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-9 items-center rounded-lg border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--darlink-text)] hover:border-[color:var(--darlink-accent)]/40 hover:bg-[color:var(--darlink-surface-muted)]"
        >
          {t("qrCreateCta")}
        </button>
      </div>
      <QRModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTargetUrl("");
        }}
        targetUrl={targetUrl}
        adCode={adCode}
      />
    </>
  );
}
