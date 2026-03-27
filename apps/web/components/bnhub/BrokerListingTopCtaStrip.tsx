"use client";

import { ImmoContactTrustRow } from "@/components/immo/ImmoContactTrustRow";
import { dispatchOpenImmoChat } from "@/lib/immo/immo-chat-events";

/**
 * Sticky top conversion rail (desktop + mobile) — opens the same Immo AI sheet as the bottom bar via custom event.
 */
export function BrokerListingTopCtaStrip({
  listingId,
}: {
  listingId: string;
}) {
  const btn =
    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold sm:text-sm";

  const log = (channel: string) => {
    fetch("/api/ai/activity", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "listing_contact_click",
        listingId,
        metadata: { channel },
      }),
    }).catch(() => {});
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/95 py-2 shadow-md backdrop-blur-md lg:z-30">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6 lg:px-8">
        <div className="hidden sm:block">
          <ImmoContactTrustRow />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btn} bg-emerald-600 text-white hover:bg-emerald-500`}
            onClick={() => {
              log("immo_top_contact_broker");
              dispatchOpenImmoChat({ listingId, channel: "contact_broker" });
            }}
          >
            Contact broker
          </button>
          <button
            type="button"
            className={`${btn} border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700`}
            onClick={() => {
              log("immo_top_book_visit");
              dispatchOpenImmoChat({ listingId, channel: "book_visit" });
            }}
          >
            Book a visit
          </button>
          <button
            type="button"
            className={`${btn} border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700`}
            onClick={() => {
              log("immo_top_ask_question");
              dispatchOpenImmoChat({ listingId, channel: "ask_question" });
            }}
          >
            Ask a question
          </button>
        </div>
      </div>
    </div>
  );
}
