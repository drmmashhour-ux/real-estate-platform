/**
 * Ads copy generator v1 — text only; no ad network APIs (strategy / creative drafts).
 */

export type AdsAudience = "buyer" | "host" | "renter" | "broker" | "investor";

export type GoogleAdsCopy = {
  headlines: string[];
  descriptions: string[];
  keywords: string[];
};

export type SocialAdsCopy = {
  facebookCaption: string;
  instagramCaption: string;
  hashtags: string[];
};

export type LandingSuggestions = {
  heroHeadline: string;
  subhead: string;
  primaryCta: string;
  secondaryCta: string;
  trustBullets: string[];
  frictionRemovals: string[];
};

export type AdsCopyBundle = {
  google: GoogleAdsCopy;
  social: SocialAdsCopy;
  landing: LandingSuggestions;
};

export function generateAdsCopyBundle(input: {
  city: string;
  audience: AdsAudience;
  listingTitle?: string | null;
}): AdsCopyBundle {
  const city = input.city.trim() || "Montréal";
  const listing = input.listingTitle?.trim();
  const aud = input.audience;

  const google: GoogleAdsCopy = {
    headlines: [
      listing ? `${listing.slice(0, 28)} — ${city}` : `Stays & homes in ${city}`,
      aud === "host" ? `List on BNHub · ${city}` : `Find your next place · ${city}`,
      `Book with confidence · ${city}`,
      `Compare listings · ${city}`,
    ],
    descriptions: [
      `Search verified short-term and long-term options in ${city}. Transparent pricing; local support.`,
      `Hosts: reach travelers and renters. Guests: book in a few clicks. No auto-commitments — browse first.`,
    ],
    keywords: [
      `${city} rental`,
      `${city} apartment`,
      `BNHub ${city}`,
      `${city} short term rental`,
    ],
  };

  const social: SocialAdsCopy = {
    facebookCaption: listing
      ? `Checking out ${listing} in ${city} on LECIPM — listings, BNHub stays, and local context in one place.`
      : `Exploring homes and stays in ${city}? LECIPM connects search, BNHub bookings, and broker tools — see what fits.`,
    instagramCaption: listing
      ? `${listing} · ${city}\n\nBrowse on LECIPM — link in bio (add your UTM). #${city.replace(/\s+/g, "")} #realestate`
      : `${city} real estate & stays — discovery + booking tools. Add your campaign UTM to measure ROI.`,
    hashtags: [`#${city.replace(/[^a-zA-Z0-9]/g, "")}`, "#realestate", "#lecipm"].filter(Boolean),
  };

  const landing: LandingSuggestions = {
    heroHeadline: aud === "host" ? `Earn more from your ${city} listing` : `Find your next home in ${city}`,
    subhead: "Clear pricing, trusted flows, and human support — no dark patterns.",
    primaryCta: aud === "host" ? "List your space" : "Browse listings",
    secondaryCta: "Talk to a broker",
    trustBullets: [
      "Law 25–aligned consent flows where applicable",
      "Real funnel + ROI reporting (no fake conversions)",
      "Broker and BNHub paths separated for clarity",
    ],
    frictionRemovals: [
      "Single primary CTA above the fold; secondary link as text",
      "Show neighbourhood + price range early",
      "Mobile-first tap targets for lead form",
    ],
  };

  return { google, social, landing };
}
