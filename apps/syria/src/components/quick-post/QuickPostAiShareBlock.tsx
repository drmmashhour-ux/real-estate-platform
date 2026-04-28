"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildListingShareMessage } from "@/lib/ai/shareMessage";
import { appendHadiahShareSource } from "@/lib/syria/hadiah-share-attribution";
import { getListingPath } from "@/lib/syria/listing-share";
import { trackListingSharedClient } from "@/lib/syria/growth-client";
import { SYRIA_PRICING } from "@/lib/pricing";
import { formatSyriaCurrency } from "@/lib/format";

export function QuickPostAiShareBlock(props: { listingId: string; title: string; city: string; price: string }) {
  const t = useTranslations("QuickPost");
  const locale = useLocale();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const priceLine = formatSyriaCurrency(Number(props.price) || 0, SYRIA_PRICING.currency, locale);

  useEffect(() => {
    const base = new URL(getListingPath(locale, props.listingId), window.location.origin).href;
    setUrl(appendHadiahShareSource(base, "whatsapp"));
  }, [locale, props.listingId]);

  async function onCopy() {
    const full = buildListingShareMessage({
      title: props.title,
      priceLine,
      city: props.city,
      url,
      locale,
      priceAmount: Number(props.price) || 0,
      highlightNew: true,
    });
    try {
      await navigator.clipboard.writeText(full);
      void trackListingSharedClient(props.listingId, { source: "copy_full_message" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-[var(--darlink-radius-xl)] border border-violet-200/70 bg-violet-50/50 p-4 text-start">
      <p className="text-xs font-semibold text-violet-950">{t("aiShareBlockTitle")}</p>
      <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-xs text-[color:var(--darlink-text)]" dir="auto">
        {url
          ? buildListingShareMessage({
              title: props.title,
              priceLine,
              city: props.city,
              url,
              locale,
              priceAmount: Number(props.price) || 0,
              highlightNew: true,
            })
          : "…"}
      </pre>
      <button
        type="button"
        className="mt-3 w-full min-h-12 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100 sm:w-auto"
        disabled={!url}
        onClick={() => void onCopy()}
      >
        {copied ? t("aiShareCopied") : t("aiCopyShareMessage")}
      </button>
    </div>
  );
}
