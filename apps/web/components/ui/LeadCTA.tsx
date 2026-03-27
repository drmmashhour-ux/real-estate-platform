"use client";

import Link from "next/link";
import { QuebecCanadaFlagsPair } from "@/components/brand/QuebecCanadaFlagsPair";
import { CONTACT_EMAIL, getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { PLATFORM_LEGAL_DISPLAY } from "@/lib/brand/platform";
import { track, TrackingEvent } from "@/lib/tracking";

export type LeadCTAVariant = "evaluation" | "broker" | "consultation";

export type LeadCTAProps = {
  variant?: LeadCTAVariant;
  className?: string;
  trustMicrocopy?: boolean;
  compactTrust?: boolean;
  /** When known (e.g. after evaluation), attach to tracking meta */
  leadId?: string | null;
};

export function LeadCTA({
  variant = "evaluation",
  className = "",
  trustMicrocopy = true,
  compactTrust = false,
  leadId = null,
}: LeadCTAProps) {
  const primary =
    variant === "evaluation"
      ? { href: "/evaluate", label: "Get FREE evaluation" }
      : variant === "broker"
        ? { href: "/broker/mohamed-al-mashhour", label: "Talk to a licensed broker" }
        : { href: "/sell#sell-consultation", label: "Get my FREE consultation" };

  const chip = compactTrust
    ? "text-[#9CA3AF]"
    : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[#9CA3AF]";

  const waMessage = `Hello — I'm interested in ${PLATFORM_LEGAL_DISPLAY} (property / broker consultation).`;
  const waHrefDirect = getContactWhatsAppUrl(waMessage);
  const waPrefill = waHrefDirect;

  const baseMeta = { variant, leadId: leadId ?? undefined };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={primary.href}
          onClick={() =>
            track(TrackingEvent.CTA_CLICKED, {
              meta: {
                ...baseMeta,
                ctaKind:
                  variant === "consultation"
                    ? "consultation"
                    : variant === "broker"
                      ? "broker_page"
                      : "get_free_evaluation",
                label: primary.label,
                href: primary.href,
              },
            })
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#C9A646] px-5 py-3 text-center text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#E8C547] sm:flex-initial sm:min-w-[200px]"
        >
          {primary.label}
        </Link>
        <Link
          href="/broker/mohamed-al-mashhour"
          onClick={() =>
            track(TrackingEvent.CTA_CLICKED, {
              meta: {
                ...baseMeta,
                ctaKind: "talk_to_broker",
                label: "Talk to a licensed broker",
                href: "/broker/mohamed-al-mashhour",
              },
            })
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#C9A646]/50 px-5 py-3 text-center text-sm font-semibold text-[#C9A646] transition hover:-translate-y-0.5 hover:bg-[#C9A646]/10 sm:flex-initial"
        >
          Talk to a licensed broker
        </Link>
        <a
          href={getBrokerTelHref()}
          onClick={() =>
            track(TrackingEvent.CALL_CLICKED, {
              meta: {
                ...baseMeta,
                ctaKind: "call_now",
                label: "Call Mohamed directly",
              },
            })
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/5 sm:flex-initial"
        >
          Call Mohamed directly
        </a>
        <a
          href={waHrefDirect}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track(TrackingEvent.WHATSAPP_CLICKED, {
              meta: { ...baseMeta, ctaKind: "whatsapp", label: "WhatsApp" },
            })
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-[#C9A646] transition hover:-translate-y-0.5 hover:bg-[#C9A646]/10 sm:flex-initial"
        >
          WhatsApp
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          onClick={() =>
            track(TrackingEvent.CTA_CLICKED, {
              meta: {
                ...baseMeta,
                ctaKind: "email",
                label: CONTACT_EMAIL,
              },
            })
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-center text-xs font-medium text-[#B3B3B3] transition hover:border-[#C9A646]/40 hover:text-white sm:flex-initial"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
      {trustMicrocopy ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
          <span className={chip}>No obligation</span>
          <span
            className={
              compactTrust
                ? "inline-flex flex-wrap items-center gap-2 text-[#9CA3AF]"
                : `inline-flex flex-wrap items-center gap-2 ${chip}`
            }
          >
            <QuebecCanadaFlagsPair gapClass="gap-2" className="shrink-0" />
            <span className="leading-tight">Quebec-based platform</span>
          </span>
          <span className={chip}>Licensed broker support</span>
        </div>
      ) : null}
      <p className="mt-2 text-[10px] text-[#525252]">
        <a
          href={waPrefill}
          onClick={() =>
            track(TrackingEvent.WHATSAPP_CLICKED, {
              meta: {
                ...baseMeta,
                ctaKind: "whatsapp_prefill",
                label: "WhatsApp prefilled",
              },
            })
          }
          className="text-[#C9A646] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp with prefilled message
        </a>
      </p>
    </div>
  );
}
