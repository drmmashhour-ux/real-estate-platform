/**
 * Reply drafts — professional or friendly tone, host-edited before send.
 */

export type MessagingAssistantInput = {
  guestMessage: string;
  listingTitle?: string;
  tone: "professional" | "friendly";
};

export type MessagingAssistantResult = {
  replies: string[];
  reasoning: string[];
};

function clip(s: string, max = 280) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function suggestMessageReplies(input: MessagingAssistantInput): MessagingAssistantResult {
  const listing = (input.listingTitle ?? "the listing").trim();
  const gm = input.guestMessage.trim();
  const reasoning: string[] = [
    "Drafts are starting points — personalize with names, dates, and accurate listing facts before sending.",
  ];

  const lower = gm.toLowerCase();
  const asksAvailability = /available|availability|open|free|book|reserve|dates?/i.test(lower);
  const asksPrice = /price|rate|nightly|how much|cost/i.test(lower);
  const asksParking = /park|parking|car|vehicle/i.test(lower);
  const asksPet = /pet|dog|cat/i.test(lower);

  const replies: string[] = [];

  if (input.tone === "professional") {
    replies.push(
      clip(
        `Thank you for your interest in ${listing}. I've received your message and will confirm details shortly.`,
      ),
    );
    if (asksAvailability) {
      replies.push(
        clip(
          `Regarding availability: please share your preferred check-in and check-out dates so I can confirm the calendar and any minimum stay.`,
        ),
      );
    }
    if (asksPrice) {
      replies.push(
        clip(
          `Nightly pricing depends on dates and length of stay. If you share your dates, I can confirm the all-in quote for your stay.`,
        ),
      );
    }
    if (asksParking) {
      replies.push(
        clip(
          `Parking: I'll confirm the exact option for your stay (on-site, street, or nearby) and any permits or fees.`,
        ),
      );
    }
    if (asksPet) {
      replies.push(
        clip(
          `Pet policy: I'll confirm whether the home can accommodate your pet under the current house rules.`,
        ),
      );
    }
  } else {
    replies.push(clip(`Hi! Thanks for reaching out about ${listing} — happy to help and I'll get back to you shortly.`));
    if (asksAvailability) {
      replies.push(
        clip(
          `If you send your ideal check-in / check-out, I can double-check the calendar and minimum nights for you.`,
        ),
      );
    }
    if (asksPrice) {
      replies.push(
        clip(
          `Pricing shifts a bit by season and length of stay — share your dates and I’ll send a clear number.`,
        ),
      );
    }
    if (asksParking) {
      replies.push(clip(`Good question on parking — I’ll confirm what works best for your dates.`));
    }
    if (asksPet) {
      replies.push(clip(`I'll check pet details against the house rules and let you know what’s possible.`));
    }
  }

  if (replies.length === 1) {
    replies.push(
      clip(
        input.tone === "professional"
          ? `Is there anything specific about amenities, check-in time, or group size I should know?`
          : `Anything I should know about your group size or check-in timing?`,
      ),
    );
  }

  return { replies: replies.slice(0, 4), reasoning };
}
