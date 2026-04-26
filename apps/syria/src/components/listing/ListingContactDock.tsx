"use client";

import { trackLeadPhoneClick, trackLeadWhatsappClick } from "@/lib/lead-client";

/** Sticky call + WhatsApp (mobile) — lead taps tracked fire-and-forget (default navigation stays instant). */
export function ListingContactDock({
  listingId,
  whatsappHref,
  telHref,
  labelWhatsapp,
  labelCall,
}: {
  listingId: string;
  whatsappHref: string | null;
  telHref: string | null;
  labelWhatsapp: string;
  labelCall: string;
}) {
  if (!whatsappHref && !telHref) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-14 z-50 max-w-[100vw] border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]/98 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] [overscroll-behavior-x:none] md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto box-border flex w-full min-w-0 max-w-7xl gap-2 sm:px-0">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              trackLeadWhatsappClick(listingId);
            }}
            className="hadiah-btn-primary inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-[var(--darlink-radius-xl)] px-2 text-sm font-semibold sm:px-3"
          >
            {labelWhatsapp}
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            onClick={() => {
              trackLeadPhoneClick(listingId);
            }}
            className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-2 text-sm font-semibold text-[color:var(--darlink-navy)] sm:px-3"
          >
            {labelCall}
          </a>
        ) : null}
      </div>
    </div>
  );
}
