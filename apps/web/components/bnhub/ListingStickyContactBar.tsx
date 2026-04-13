"use client";

import Link from "next/link";
import { useState, useCallback, useMemo, useEffect } from "react";
import { getPhoneTelLink } from "@/lib/phone";
import { ClientCommunicationChat } from "@/components/ai/ClientCommunicationChat";
import { ImmoContactTrustRow } from "@/components/immo/ImmoContactTrustRow";
import { IMMO_OPEN_CHAT_EVENT, type ImmoOpenChatDetail } from "@/lib/immo/immo-chat-events";
import { LISTING_EXPLORE_NO_PAYMENT_LINE } from "@/lib/listings/listing-ad-trust-copy";
import { CTA_PRIMARY_LG } from "@/lib/ui/cta-classes";

export type ImmoContactSource = "contact_broker" | "book_visit" | "more_info" | "ask_question";

function logContact(listingId: string, channel: string) {
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
}

type ImmoListingProps = {
  listingTitle: string;
  location: string;
  /** Short city for chat context (optional). */
  city?: string;
};

function ContactButtons({
  listingId,
  listingCode,
  hostId,
  hostPhone,
  supportTel,
  contactLabel,
  layout,
  immo,
  onImmoOpen,
}: {
  listingId: string;
  listingCode?: string | null;
  hostId: string;
  hostPhone?: string | null;
  supportTel?: string;
  contactLabel: string;
  layout: "row" | "column";
  immo?: ImmoListingProps;
  onImmoOpen: (source: ImmoContactSource) => void;
}) {
  const listingRef = listingCode?.trim() || listingId;
  const messagesHref = `/messages?host=${encodeURIComponent(hostId)}&listing=${encodeURIComponent(listingRef)}`;
  const hostTel = hostPhone?.trim() ? getPhoneTelLink(hostPhone) : "";
  const tel = hostTel || supportTel || "";

  const useImmo = Boolean(immo);
  const flex =
    layout === "row"
      ? useImmo
        ? "flex-col gap-2 sm:flex-row sm:flex-wrap"
        : "flex-row gap-2"
      : "flex-col gap-2";

  const primaryClass =
    layout === "row"
      ? `flex min-h-[44px] flex-1 items-center justify-center text-center text-sm ${CTA_PRIMARY_LG} px-3 py-2`
      : `flex min-h-[44px] items-center justify-center text-sm ${CTA_PRIMARY_LG} px-4 py-3`;

  const secondaryOutline =
    "flex min-h-[44px] items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-center text-xs font-semibold text-slate-100 hover:bg-slate-700 sm:text-sm";

  return (
    <div className={`flex ${flex} items-stretch`}>
      <a
        href="#availability"
        className={primaryClass}
        onClick={() => logContact(listingId, "book_now_sticky")}
      >
        Reserve now
      </a>
      {useImmo ? (
        <button
          type="button"
          onClick={() => {
            logContact(listingId, "immo_contact_broker");
            onImmoOpen("contact_broker");
          }}
          className={secondaryOutline}
        >
          Contact broker
        </button>
      ) : (
        <Link
          href={messagesHref}
          onClick={() => logContact(listingId, "contact_host")}
          className={secondaryOutline}
        >
          {contactLabel}
        </Link>
      )}
      {useImmo ? (
        <button
          type="button"
          onClick={() => {
            logContact(listingId, "immo_book_visit");
            onImmoOpen("book_visit");
          }}
          className={secondaryOutline}
        >
          Book a visit
        </button>
      ) : null}
      {useImmo ? (
        <button
          type="button"
          onClick={() => {
            logContact(listingId, "immo_ask_question");
            onImmoOpen("ask_question");
          }}
          className={secondaryOutline}
        >
          Ask a question
        </button>
      ) : (
        <Link
          href={messagesHref}
          onClick={() => logContact(listingId, "chat")}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
          aria-label="Open chat"
          title="Chat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </Link>
      )}
      {tel ? (
        <a
          href={tel}
          onClick={() => logContact(listingId, hostTel ? "phone_host" : "phone_support")}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
          aria-label="Call"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </a>
      ) : null}
    </div>
  );
}

/** Mobile bottom bar + desktop floating contact dock (always reachable). AI-first Immo funnel when `immoListing` is set. */
export function ListingStickyContactBar({
  listingId,
  listingCode,
  hostId,
  hostPhone,
  supportTel,
  contactLabel,
  immoListing,
  introducedByBrokerId,
  /** When true, skip the dark mobile bottom dock (e.g. BNHub uses `BnhubMobileStickyBookingBar` instead). */
  suppressMobileFixed = false,
}: {
  listingId: string;
  listingCode?: string | null;
  hostId: string;
  hostPhone?: string | null;
  supportTel?: string;
  contactLabel: string;
  immoListing?: ImmoListingProps;
  /** BNHUB listing owner (broker) for AI handoff + scoring. */
  introducedByBrokerId?: string | null;
  suppressMobileFixed?: boolean;
}) {
  const [immoOpen, setImmoOpen] = useState(false);

  const onImmoOpen = useCallback((_source: ImmoContactSource) => {
    setImmoOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<ImmoOpenChatDetail>).detail;
      if (d?.listingId === listingId) setImmoOpen(true);
    };
    window.addEventListener(IMMO_OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(IMMO_OPEN_CHAT_EVENT, onOpen);
  }, [listingId]);

  const chatContext = useMemo(
    () => ({
      listingId,
      listingTitle: immoListing?.listingTitle ?? null,
      city: immoListing?.city?.trim() || immoListing?.location?.split(",")[0]?.trim() || null,
      introducedByBrokerId: introducedByBrokerId ?? null,
    }),
    [listingId, immoListing, introducedByBrokerId]
  );

  return (
    <>
      {immoListing && immoOpen ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/55 backdrop-blur-[2px] lg:items-end lg:justify-center lg:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Contact assistant"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImmoOpen(false);
          }}
        >
          <div
            className="mx-auto w-full max-w-lg px-2 pb-[env(safe-area-inset-bottom)] lg:mx-0 lg:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <ClientCommunicationChat
              key={`${listingId}-immo-chat`}
              context={chatContext}
              accent="#10b981"
              embedded
              autoBootstrap
              flow="immo_high_conversion"
              variant="immo"
            />
            <button
              type="button"
              onClick={() => setImmoOpen(false)}
              className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/90 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {!suppressMobileFixed ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950/95 px-3 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          role="region"
          aria-label="Contact"
        >
          <div className="mx-auto flex max-w-lg flex-col items-stretch justify-center gap-2">
            {!immoListing ? (
              <p className="text-center text-[11px] font-semibold leading-tight text-emerald-200/85">
                {LISTING_EXPLORE_NO_PAYMENT_LINE}
              </p>
            ) : null}
            {immoListing ? <ImmoContactTrustRow /> : null}
            <ContactButtons
              listingId={listingId}
              listingCode={listingCode}
              hostId={hostId}
              hostPhone={hostPhone}
              supportTel={supportTel}
              contactLabel={contactLabel}
              layout="row"
              immo={immoListing}
              onImmoOpen={onImmoOpen}
            />
          </div>
        </div>
      ) : null}
      <div
        className="pointer-events-none fixed bottom-8 right-6 z-40 hidden lg:block"
        role="region"
        aria-label="Quick contact"
      >
        <div className="pointer-events-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md">
          {immoListing ? (
            <div className="mb-2 px-1">
              <ImmoContactTrustRow />
            </div>
          ) : null}
          <ContactButtons
            listingId={listingId}
            listingCode={listingCode}
            hostId={hostId}
            hostPhone={hostPhone}
            supportTel={supportTel}
            contactLabel={contactLabel}
            layout="column"
            immo={immoListing}
            onImmoOpen={onImmoOpen}
          />
        </div>
      </div>
    </>
  );
}
