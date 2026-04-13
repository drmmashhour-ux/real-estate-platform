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
  /** default: pill buttons · compact: smaller pills · unified: single segmented control */
  variant?: "default" | "compact" | "unified";
  /** `light` for pale backgrounds (e.g. BNHub listing hero). */
  tone?: "dark" | "light";
  className?: string;
  /** When set, increments listing share analytics on successful share / copy / WhatsApp open */
  listingAnalytics?: { kind: "FSBO" | "CRM"; listingId: string };
  /** Hero / strict hierarchy: only the Share control (no copy / WhatsApp pills). */
  shareOnly?: boolean;
  /** Merged onto the Share button when `shareOnly` is true (e.g. match secondary CTA styling). */
  shareButtonClassName?: string;
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
  shareOnly = false,
  shareButtonClassName = "",
  tone = "dark",
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

  const unifiedSegDark =
    "flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-white/90 transition hover:bg-white/[0.06] sm:gap-2 sm:px-3 sm:text-sm";
  const unifiedSegLight =
    "flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm";

  if (variant === "unified") {
    const unifiedSeg = tone === "light" ? unifiedSegLight : unifiedSegDark;
    const shell =
      tone === "light"
        ? `inline-flex w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`.trim()
        : `inline-flex w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`.trim();
    const borderDiv = tone === "light" ? "border-e border-slate-200" : "border-e border-white/10";
    const waTone =
      tone === "light"
        ? `${unifiedSeg} no-underline border-slate-200 text-emerald-700 hover:text-emerald-800`
        : `${unifiedSeg} no-underline text-emerald-300/95 hover:text-emerald-200`;
    return (
      <div className={shell} role="group" aria-label="Share this listing">
        <button type="button" onClick={() => void onNativeShare()} className={`${unifiedSeg} ${borderDiv}`}>
          <Share2 className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
          <span className="truncate">Share</span>
        </button>
        <button type="button" onClick={() => void onCopy()} className={`${unifiedSeg} ${borderDiv}`}>
          <Link2 className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
          <span className="truncate">{copied ? "Copied" : "Copy"}</span>
        </button>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (listingAnalytics) fireListingShareAnalytics(listingAnalytics);
          }}
          className={waTone}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="truncate">WhatsApp</span>
        </a>
      </div>
    );
  }

  const btnDark =
    variant === "compact"
      ? "rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-premium-gold/35"
      : "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/90 transition hover:border-premium-gold/35";
  const btnLight =
    variant === "compact"
      ? "rounded-full border border-slate-300/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
      : "inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50";
  const btn = tone === "light" ? btnLight : btnDark;

  if (shareOnly) {
    const compactBtn =
      variant === "compact"
        ? btn
        : tone === "light"
          ? "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
          : "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-transparent px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white/85 sm:w-auto";
    const merged = shareButtonClassName?.trim()
      ? `inline-flex w-full items-center justify-center gap-2 sm:w-auto ${shareButtonClassName}`.trim()
      : compactBtn;
    return (
      <div className={className.trim()}>
        <button type="button" onClick={() => void onNativeShare()} className={merged}>
          <Share2 className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
          Share
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <button type="button" onClick={() => void onNativeShare()} className={btn}>
        <Share2 className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
        Share
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
