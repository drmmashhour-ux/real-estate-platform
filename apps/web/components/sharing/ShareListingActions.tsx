"use client";

import { useCallback, useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";

export type ShareListingActionsProps = {
  /** e.g. listing title */
  shareTitle: string;
  /** Optional extra line for native share / WhatsApp */
  shareText?: string;
  /** Defaults to current page URL */
  url?: string;
  /** Compact row (e.g. sticky bar) */
  variant?: "default" | "compact";
  className?: string;
  /** When set, increments listing share analytics on successful share / copy / WhatsApp open */
  listingAnalytics?: { kind: "FSBO" | "CRM"; listingId: string };
};

function buildWhatsAppUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function fireListingShareAnalytics(listingAnalytics: { kind: "FSBO" | "CRM"; listingId: string }) {
  void fetch("/api/listings/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: listingAnalytics.kind,
      listingId: listingAnalytics.listingId,
      event: "share",
    }),
  }).catch(() => {});
}

export function ShareListingActions({
  shareTitle,
  shareText,
  url: urlProp,
  variant = "default",
  className = "",
  listingAnalytics,
}: ShareListingActionsProps) {
  const [copied, setCopied] = useState(false);

  const resolveUrl = useCallback(() => {
    if (urlProp) return urlProp;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [urlProp]);

  const fullMessage = [shareText ?? `Check out this listing: ${shareTitle}`, resolveUrl()].filter(Boolean).join("\n\n");

  const onCopy = async () => {
    const u = resolveUrl();
    if (!u) return;
    try {
      await navigator.clipboard.writeText(u);
      if (listingAnalytics) fireListingShareAnalytics(listingAnalytics);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const onNativeShare = async () => {
    const u = resolveUrl();
    if (!u || typeof navigator === "undefined" || !navigator.share) {
      await onCopy();
      return;
    }
    try {
      await navigator.share({ title: shareTitle, text: shareText ?? shareTitle, url: u });
      if (listingAnalytics) fireListingShareAnalytics(listingAnalytics);
    } catch {
      /* dismissed */
    }
  };

  const wa = buildWhatsAppUrl(fullMessage);

  const btn =
    variant === "compact"
      ? "rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-premium-gold/35"
      : "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/90 transition hover:border-premium-gold/35";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <button type="button" onClick={() => void onNativeShare()} className={btn}>
        <Share2 className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
        {variant === "compact" ? "Share" : "Share"}
      </button>
      <button type="button" onClick={() => void onCopy()} className={btn}>
        <Link2 className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (listingAnalytics) fireListingShareAnalytics(listingAnalytics);
        }}
        className={`${btn} no-underline`}
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
        WhatsApp
      </a>
    </div>
  );
}
