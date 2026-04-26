"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildListingShareMessage } from "@/lib/ai/shareMessage";
import { buildWhatsAppMeShareHref, getListingPath } from "@/lib/syria/listing-share";
import { trackListingSharedClient } from "@/lib/syria/growth-client";

function openWhatsAppWithTracking(listingId: string, text: string) {
  const href = buildWhatsAppMeShareHref(text);
  void trackListingSharedClient(listingId, { source: "whatsapp" });
  window.open(href, "_blank", "noopener,noreferrer");
}

type Props = {
  listingId: string;
  /** When set with sharePriceLine, message follows `lib/ai/shareMessage` (AR/EN + link). */
  shareTitle?: string;
  sharePriceLine?: string;
  shareCity?: string;
};

export function ListingShareActions({ listingId, shareTitle, sharePriceLine, shareCity }: Props) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const [fullUrl, setFullUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFullUrl(new URL(getListingPath(locale, listingId), window.location.origin).href);
  }, [locale, listingId]);

  const shareText = useMemo(() => {
    if (!fullUrl) return "";
    if (shareTitle && sharePriceLine) {
      return buildListingShareMessage({
        title: shareTitle,
        priceLine: sharePriceLine,
        url: fullUrl,
        locale,
        city: shareCity,
      });
    }
    return t("shareWhatsAppBody", { url: fullUrl });
  }, [fullUrl, shareTitle, sharePriceLine, shareCity, locale, t]);

  async function onCopy() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      void trackListingSharedClient(listingId, { source: "copy_link" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
      <button
        type="button"
        disabled={!fullUrl || !shareText}
        className="min-h-12 w-full min-w-0 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:min-w-[200px] sm:max-w-sm"
        onClick={() => {
          if (shareText) openWhatsAppWithTracking(listingId, shareText);
        }}
      >
        {t("shareButton")}
      </button>
      <button
        type="button"
        disabled={!fullUrl}
        className="min-h-12 w-full min-w-0 rounded border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2 text-sm font-medium text-[color:var(--darlink-text)] disabled:opacity-50 sm:min-w-[160px]"
        onClick={() => void onCopy()}
      >
        {copied ? t("linkCopied") : t("copyLink")}
      </button>
    </div>
  );
}
