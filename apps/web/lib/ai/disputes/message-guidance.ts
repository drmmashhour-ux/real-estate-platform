import type { AiDisputeRiskSignalType } from "@prisma/client";

/**
 * Suggested neutral copy for hosts and guests — drafts only; never auto-sent unless product settings enable it elsewhere.
 */
export function getDisputePreventionDrafts(input: {
  signalType: AiDisputeRiskSignalType;
  listingTitle?: string;
}): { host: string | null; guest: string | null } {
  const title = input.listingTitle?.trim() || "your stay";

  const map: Record<
    AiDisputeRiskSignalType,
    { host: string | null; guest: string | null }
  > = {
    MISSING_CHECKIN_DETAILS: {
      host: `Please add clear check-in instructions and access details for “${title}” so your guest can arrive smoothly.`,
      guest: `Please confirm you received check-in details for “${title}”. If anything is unclear, message your host before arrival.`,
    },
    MISSING_CHECKIN_COMPLETION: {
      host: `If your guest has checked in, please confirm arrival in the booking timeline when you can. If not, a quick message can help avoid misunderstandings.`,
      guest: `Please confirm check-in when you arrive so your host and the platform have a clear record — it helps prevent confusion later.`,
    },
    GUEST_SLOW_RESPONSE: {
      host: null,
      guest: `Your host sent a message about “${title}”. A quick reply keeps everyone aligned and helps prevent issues.`,
    },
    HOST_SLOW_RESPONSE: {
      host: `The guest messaged you about “${title}”. A timely reply reduces friction and helps prevent disputes.`,
      guest: null,
    },
    REPEATED_BOOKING_ISSUES: {
      host: `There are multiple open issues tied to “${title}”. Please document facts in the thread and work with your guest neutrally; escalate only through platform support if needed.`,
      guest: `There are multiple open items on this booking. Please keep communication in the booking thread and avoid side deals — the platform can help mediate if needed.`,
    },
    NEGATIVE_FEEDBACK_SIGNAL: {
      host: `Recent feedback suggests a mismatch on “${title}”. Please review the listing accuracy and respond professionally in the booking thread.`,
      guest: `We noticed strong negative signals on this stay. Please keep communication factual in the booking thread; the platform does not decide outcomes automatically.`,
    },
    INCOMPLETE_LISTING_SIGNAL: {
      host: `Your listing for “${title}” may be missing verification or photos. Completing the listing reduces guest confusion and disputes.`,
      guest: `Some listing details may still be pending verification. If something doesn’t match what you booked, use the booking messages to clarify — the platform stays neutral.`,
    },
    HOST_ROOM_READINESS_MISSING: {
      host: `Please confirm room/unit readiness in the checklist before check-in for “${title}” so guests know what to expect.`,
      guest: `Your host should confirm readiness before check-in. If you haven’t seen that confirmation, send a polite reminder in the booking thread.`,
    },
  };

  return map[input.signalType];
}
