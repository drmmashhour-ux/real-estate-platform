"use client";

import Link from "next/link";
import { track, TrackingEvent } from "@/lib/tracking";

function logBookSticky(listingId: string) {
  fetch("/api/ai/activity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "listing_contact_click",
      listingId,
      metadata: { channel: "book_now_mobile_sticky" },
    }),
  }).catch(() => {});
}

/**
 * Fixed bottom bar (mobile + desktop): nightly (+ optional example total) + Book now CTA.
 */
export function BnhubMobileStickyBookingBar({
  listingId,
  nightPriceFormatted,
  exampleTotalFormatted,
  contactHref,
  contactLabel,
  availabilityHref = "#availability",
  hostPayoutReady,
  primaryCtaLabel = "Book now",
  reassuranceLine = "No charge until confirmation",
  stripeTrustLine,
  listingCtaExperiment,
}: {
  listingId: string;
  /** Localized money string for one night, e.g. $129.00 */
  nightPriceFormatted: string;
  /** Example stay total (e.g. 2 nights) for decision speed */
  exampleTotalFormatted?: string;
  contactHref: string;
  contactLabel: string;
  availabilityHref?: string;
  hostPayoutReady: boolean;
  primaryCtaLabel?: string;
  reassuranceLine?: string;
  /** When null, hide the Stripe trust footnote. */
  stripeTrustLine?: string | null;
  listingCtaExperiment?: { experimentId: string; variantId: string };
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-neutral-200/90 bg-white/95 shadow-[0_-8px_32px_rgba(0,0,0,0.07)] backdrop-blur-md supports-[backdrop-filter]:bg-white/92"
      style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Book this stay"
    >
      <div className="lecipm-safe-gutter-x mx-auto flex max-w-lg items-end justify-between gap-3 px-1 pt-2.5">
        <div className="min-w-0 flex-1 pb-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Per night</p>
          <p className="truncate text-[1.35rem] font-bold leading-tight tabular-nums text-slate-900">
            {nightPriceFormatted}
            <span className="text-sm font-semibold text-slate-600">/night</span>
          </p>
          {exampleTotalFormatted ? (
            <p className="mt-0.5 text-[11px] font-medium tabular-nums text-slate-600">
              From {exampleTotalFormatted} total <span className="text-slate-400">(example stay)</span>
            </p>
          ) : null}
          {!hostPayoutReady ? (
            <p className="mt-0.5 text-[10px] font-medium text-amber-800">Host finishing payout setup</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1">
          <a
            href={availabilityHref}
            className="inline-flex min-h-[50px] min-w-[148px] items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 px-5 text-base font-extrabold tracking-tight text-slate-900 shadow-[0_4px_14px_rgba(180,83,9,0.45)] ring-2 ring-amber-300/90 ring-offset-1 ring-offset-white transition hover:from-amber-300 hover:via-amber-400 hover:to-amber-600 hover:shadow-[0_6px_18px_rgba(180,83,9,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-[0.99]"
            onClick={() => {
              track(TrackingEvent.CTA_CLICK, {
                meta: { listing_id: listingId, cta: "reserve_sticky", surface: "bnhub_stay" },
              });
              logBookSticky(listingId);
              if (listingCtaExperiment) {
                void fetch("/api/experiments/track", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    experimentId: listingCtaExperiment.experimentId,
                    variantId: listingCtaExperiment.variantId,
                    eventName: "cta_click",
                    metadata: { cta: "reserve_sticky", surface: "bnhub_stay", listingId },
                  }),
                }).catch(() => {});
              }
            }}
          >
            {primaryCtaLabel}
          </a>
          <p className="max-w-[180px] text-center text-[10px] font-medium leading-tight text-slate-600">
            {reassuranceLine}
          </p>
          {stripeTrustLine != null && stripeTrustLine !== "" ? (
            <p className="max-w-[180px] text-center text-[10px] leading-tight text-slate-500">{stripeTrustLine}</p>
          ) : null}
          <Link
            href={contactHref}
            className="py-0.5 text-center text-[11px] font-semibold text-[#006ce4] underline-offset-2 hover:underline"
          >
            {contactLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
