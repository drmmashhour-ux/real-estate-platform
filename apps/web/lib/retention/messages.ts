/**
 * Copy for compliant re-engagement (Order 58). Delivery is always gated by opt-in + admin outside dry run.
 */
export type ReengagementUserInput = {
  name: string | null;
  homeCity: string | null;
  /** Days since last activity (coarse). */
  daysInactive: number;
  /** e.g. recent BOOKING_START / listing views. */
  highIntent: boolean;
  /** Optional hook from last viewed city/listing. */
  preferredCity?: string | null;
};

export type ReengagementMessagePack = {
  email: { subject: string; body: string };
  /** SMS body; omit when channel will be email-only. */
  sms?: string;
};

const brand = "LECIPM";

export function generateReengagementMessage(u: ReengagementUserInput): ReengagementMessagePack {
  const who = (u.name ?? "there").trim() || "there";
  const city = u.preferredCity ?? u.homeCity;

  if (u.highIntent) {
    return {
      email: {
        subject: "Listings you looked at are still on LECIPM",
        body: `Hi ${who},

You showed strong interest recently — the homes and stays you checked out are still available.

${city ? `We’re seeing new inventory around ${city} as well. ` : ""}Open the app to continue where you left off.

— ${brand}`,
      },
      sms: `${brand}: you left mid-search — your viewed listings are still here. ${city ? `More near ${city}.` : "Tap in to keep browsing."} Reply STOP to opt out.`,
    };
  }

  if (u.daysInactive >= 3 && u.daysInactive <= 5) {
    return {
      email: {
        subject: "New listings you might like",
        body: `Hi ${who},

We’ve added new listings you might like since you last stopped by.

${city ? `There’s more around ${city} worth a look.` : "Jump back in to see what’s new in your market."}

— ${brand}`,
      },
      sms: `${brand}: new places matching your market since your last visit. ${city ? `(${city})` : ""} Open the app. Reply STOP to opt out.`,
    };
  }

  return {
    email: {
      subject: "We’d love to see you back on LECIPM",
      body: `Hi ${who},

It’s been a while — we’re constantly improving search, pricing, and trust on ${brand}.

${city ? `A quick peek at ${city} may surface something new for you.` : "Log in to pick up your discovery where you left off."}

— ${brand}`,
    },
    sms: `${brand}: it’s been a while — we miss you! Fresh inventory and prices update often. Open the app. Reply STOP to opt out.`,
  };
}
