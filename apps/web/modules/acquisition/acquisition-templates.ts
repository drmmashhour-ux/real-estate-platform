import type { AcquisitionContactType } from "./acquisition.types";

export type AcquisitionTemplateVm = {
  kind: AcquisitionContactType;
  headline: string;
  body: string;
};

/** Stored copy packs for manual outreach — not automated sends. */
export const ACQUISITION_MESSAGE_TEMPLATES: AcquisitionTemplateVm[] = [
  {
    kind: "BROKER",
    headline: "We bring you ready-to-close leads",
    body:
      "LECIPM routes serious buyers and sellers into one brokerage-grade workspace — fewer dead-end inquiries, clearer next steps. If you want a short walkthrough of how leads flow into your CRM, reply with a time that works.",
  },
  {
    kind: "HOST",
    headline: "List your property and start earning immediately",
    body:
      "BNHub on LECIPM helps you publish a premium stay listing, sync calendars, and collect payouts with transparent host tooling. Happy to share what hosts in your area are seeing — no obligation.",
  },
  {
    kind: "RESIDENCE",
    headline: "Get discovered by families actively searching",
    body:
      "The Soins / residence side of LECIPM is built for compliant discovery — families can compare options without noise. We can profile your residence and match intent when you are ready.",
  },
  {
    kind: "USER",
    headline: "Find your next home or stay faster",
    body:
      "LECIPM unifies search, guided tours, and short stays in one luxury experience. Create a free account to save listings and move from browse to booking with fewer handoffs.",
  },
];

export function templateForType(t: AcquisitionContactType): AcquisitionTemplateVm {
  return ACQUISITION_MESSAGE_TEMPLATES.find((x) => x.kind === t) ?? ACQUISITION_MESSAGE_TEMPLATES[3];
}
