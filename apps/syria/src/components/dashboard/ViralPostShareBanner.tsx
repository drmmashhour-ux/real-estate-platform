"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * After-publish strip on `/dashboard?posted=1` (and listings): WA primary + copy canonical listing URL.
 */
export function ViralPostShareBanner({
  whatsappHref,
  canonicalListingUrl,
}: {
  whatsappHref: string;
  canonicalListingUrl: string;
}) {
  const t = useTranslations("Dashboard");
  const tList = useTranslations("Listing");
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(canonicalListingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5">
      <p className="text-sm font-semibold text-emerald-950">{t("postShareTitle")}</p>
      <div className="mt-4 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="hadiah-btn-primary inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-[400px]:w-auto"
        >
          {t("postShareWhatsapp")}
        </a>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border-2 border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--darlink-text)] min-[400px]:w-auto"
        >
          {copied ? tList("linkCopied") : tList("copyLink")}
        </button>
      </div>
    </div>
  );
}
