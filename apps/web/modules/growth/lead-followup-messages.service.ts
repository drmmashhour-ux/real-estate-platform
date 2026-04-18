import type { LeadFollowUpMessage } from "./lead-followup-messages.types";

const CITY = "[CITY]";

/**
 * Copy-paste drafts for humans. Does not send SMS/email.
 */
export function getLeadFollowUpMessages(city: string): LeadFollowUpMessage[] {
  const c = city.trim() || CITY;

  return [
    {
      stage: "instant",
      message: `Hey! Just saw your request about buying in ${c}.
Are you looking for something soon or just exploring?`,
    },
    {
      stage: "5min",
      message: `I can send you a few great options in ${c}.
What's your budget range and preferred area?`,
    },
    {
      stage: "1hour",
      message: `I have a couple of strong listings that might match what you're looking for.
Would you like me to connect you with a local agent?`,
    },
    {
      stage: "same_day",
      message: `Just checking in — are you still looking to buy in ${c}?
I can help you move fast if you've found something interesting.`,
    },
    {
      stage: "next_day",
      message: `I don't want you to miss good opportunities — the market moves quickly.
Let me know if you still want help finding the right place.`,
    },
  ];
}
