import type { SocialContentPackage } from "./social-content.types";

/** Template-based captions — no superlatives unless passed in as verified labels. */
export function buildCaptionPackages(input: {
  city: string;
  priceLabel: string;
  listingTitle: string;
  path: string;
}): SocialContentPackage[] {
  const baseCompliance = [
    "Do not imply guaranteed returns.",
    "Use only verified listing imagery and facts from the platform.",
  ];
  const hook = `New on LECIPM in ${input.city}: ${input.listingTitle}`.slice(0, 120);
  const cta = `See details: ${input.path}`;

  const ig: SocialContentPackage = {
    platform: "instagram_post",
    hook,
    shortCaption: `${input.listingTitle} — ${input.priceLabel}`.slice(0, 220),
    longCaption: `${input.listingTitle} in ${input.city}. ${input.priceLabel}. ${cta}`,
    cta,
    hashtags: ["#RealEstate", "#LECIPM", `#${input.city.replace(/\s+/g, "")}`].slice(0, 8),
    complianceNotes: baseCompliance,
    destinationPath: input.path,
  };

  const li: SocialContentPackage = {
    platform: "linkedin",
    hook,
    shortCaption: `Listing spotlight — ${input.city}: ${input.priceLabel}`,
    longCaption: `Professional listing highlight: ${input.listingTitle}. ${cta}`,
    cta,
    hashtags: ["#RealEstate"],
    complianceNotes: baseCompliance,
    destinationPath: input.path,
  };

  return [ig, li];
}
