import type { ImmoContactEventType } from "@prisma/client";
import type { TimelineBadgeVariant } from "@/components/timeline/timeline-badge";

/** Stable snake_case slug for APIs and analytics (maps from Prisma enum). */
export function immoEventSlug(type: ImmoContactEventType): string {
  const map: Record<ImmoContactEventType, string> = {
    VIEW: "listing_view",
    CONTACT_CLICK: "contact_click",
    MESSAGE: "message",
    CALL: "call",
    BOOKING_REQUEST: "booking_request",
    DEAL_STARTED: "deal_started",
    CONTACT_FORM_SUBMITTED: "contact_form_submitted",
    CONVERSATION_STARTED: "conversation_started",
    OFFER_STARTED: "offer_started",
    DEAL_LINKED: "deal_linked",
  };
  return map[type] ?? String(type).toLowerCase();
}

export function immoEventTitle(type: ImmoContactEventType): string {
  const map: Record<ImmoContactEventType, string> = {
    VIEW: "Listing viewed",
    CONTACT_CLICK: "Contact clicked",
    MESSAGE: "Message sent",
    CALL: "Call initiated",
    BOOKING_REQUEST: "Booking requested",
    DEAL_STARTED: "Deal started",
    CONTACT_FORM_SUBMITTED: "Contact form submitted",
    CONVERSATION_STARTED: "Conversation started",
    OFFER_STARTED: "Offer started",
    DEAL_LINKED: "Deal linked to lead",
  };
  return map[type] ?? type;
}

export function immoEventBadge(type: ImmoContactEventType): TimelineBadgeVariant {
  switch (type) {
    case "VIEW":
      return "neutral";
    case "CONTACT_CLICK":
    case "CONTACT_FORM_SUBMITTED":
      return "contacted";
    case "MESSAGE":
    case "CONVERSATION_STARTED":
      return "scheduled";
    case "CALL":
      return "contacted";
    case "BOOKING_REQUEST":
      return "scheduled";
    case "DEAL_STARTED":
    case "OFFER_STARTED":
    case "DEAL_LINKED":
      return "signed";
    default:
      return "neutral";
  }
}
