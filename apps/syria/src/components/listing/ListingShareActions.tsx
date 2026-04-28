"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildListingShareMessage } from "@/lib/ai/shareMessage";
import { appendHadiahShareSource } from "@/lib/syria/hadiah-share-attribution";
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
  /** default | growth: share WA + copy. copyOnly: link only (avoids competing with contact CTAs). */
  variant?: "default" | "growth" | "copyOnly";
  /** Override WhatsApp button label; defaults to Listing.shareButton */
  whatsappLabel?: string;
  /** Override copy button label; defaults to Listing.copyLink */
  copyButtonLabel?: string;
  /** Legacy compatibility — not emitted in SYBNB-111 viral message. */
  sharePriceAmount?: number;
  /** SY-28 */
  adCode?: string;
  /** Matches browse “New” window — adds 📢 line to viral share copy. */
  highlightNew?: boolean;
};

export function ListingShareActions({
  listingId,
  shareTitle,
  sharePriceLine,
  shareCity,
  variant = "default",
  whatsappLabel,
  copyButtonLabel,
  sharePriceAmount,
  adCode,
  highlightNew,
}: Props) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  /** ORDER SYBNB-112 — WhatsApp body contains link attributed as `whatsapp`; copy uses `copy_link`. */
  const [shareUrlWhatsapp, setShareUrlWhatsapp] = useState("");
  const [shareUrlCopy, setShareUrlCopy] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const base = new URL(getListingPath(locale, listingId), window.location.origin).href;
    setShareUrlWhatsapp(appendHadiahShareSource(base, "whatsapp"));
    setShareUrlCopy(appendHadiahShareSource(base, "copy_link"));
  }, [locale, listingId]);

  const shareText = useMemo(() => {
    if (!shareUrlWhatsapp) return "";
    if (shareTitle && sharePriceLine) {
      return buildListingShareMessage({
        title: shareTitle,
        priceLine: sharePriceLine,
        url: shareUrlWhatsapp,
        locale,
        city: shareCity,
        adCode,
        priceAmount: sharePriceAmount,
        highlightNew,
      });
    }
    return t("shareWhatsAppBody", { url: shareUrlWhatsapp });
  }, [shareUrlWhatsapp, shareTitle, sharePriceLine, shareCity, sharePriceAmount, adCode, highlightNew, locale, t]);

  async function onCopy() {
    if (!shareUrlCopy) return;
    try {
      await navigator.clipboard.writeText(shareUrlCopy);
      setCopied(true);
      void trackListingSharedClient(listingId, { source: "copy_link" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (variant === "copyOnly") {
    return (
      <div className="w-full min-w-0 max-w-full">
        <button
          type="button"
          disabled={!shareUrlCopy}
          className="w-full min-h-10 rounded-lg border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-xs font-medium text-[color:var(--darlink-text)] disabled:opacity-50"
          onClick={() => void onCopy()}
        >
          {copied ? t("linkCopied") : copyButtonLabel ?? t("copyLink")}
        </button>
      </div>
    );
  }

  const waClass =
    variant === "growth"
      ? "min-h-14 w-full min-w-0 rounded-xl bg-green-600 px-5 py-3 text-base font-bold text-white shadow-md shadow-green-900/20 ring-2 ring-green-500/30 hover:bg-green-700 disabled:opacity-50 sm:min-w-[220px] sm:max-w-md"
      : "min-h-12 w-full min-w-0 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:min-w-[200px] sm:max-w-sm";
  const secondaryClass =
    variant === "growth"
      ? "min-h-12 w-full min-w-0 rounded-xl border-2 border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--darlink-text)] disabled:opacity-50 sm:min-w-[160px]"
      : "min-h-12 w-full min-w-0 rounded border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2 text-sm font-medium text-[color:var(--darlink-text)] disabled:opacity-50 sm:min-w-[160px]";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
      <button
        type="button"
        disabled={!shareUrlWhatsapp || !shareText}
        className={waClass}
        onClick={() => {
          if (shareText) openWhatsAppWithTracking(listingId, shareText);
        }}
      >
        {whatsappLabel ?? t("shareButton")}
      </button>
      <button type="button" disabled={!shareUrlCopy} className={secondaryClass} onClick={() => void onCopy()}>
        {copied ? t("linkCopied") : copyButtonLabel ?? t("copyLink")}
      </button>
    </div>
  );
}
