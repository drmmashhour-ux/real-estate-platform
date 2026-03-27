import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";

/** Canned demo payloads so legal AI sections are never empty (Part 8). */
export const demoLegalExplainSection = {
  plainSummary:
    "In practice, you should treat listing photos and text as platform-only unless you have written permission to reuse them elsewhere — for example, you cannot copy photos into your own ads or flyers without rights.",
  example:
    "Example: You cannot reuse listing photos outside the platform without permission from the copyright holder.",
  disclaimer: AI_LEGAL_DISCLAIMER,
};

export const demoLegalActionWarning = {
  riskDetected: true,
  message:
    "This action may violate content usage rules if photos or descriptions are reused off-platform without permission, or if the listing text omits material facts you know about.",
  requiresConfirmation: true,
  disclaimer: AI_LEGAL_DISCLAIMER,
};

export const demoLegalReadiness = {
  score: 72,
  flags: ["Description could better disclose parking and inclusions.", "Only two photos — more angles build trust."],
  recommendedFixes: [
    "Add exterior and kitchen photos you have rights to use.",
    "State year built and condo fees if applicable.",
    "Confirm you own or can license every image.",
  ],
  narrative:
    "Overall the draft is on the right track. Strengthening disclosures and visuals will reduce misunderstanding risk.",
  disclaimer: AI_LEGAL_DISCLAIMER,
};

export const demoContractExplain = {
  summary:
    "You agree to accurate contact information, to follow marketplace rules, and that the platform may record this acceptance for compliance.",
  risks: ["If you proceed with incomplete information, follow-up from brokers may be delayed.", "Mortgage-related forms may affect how lenders view your file — verify details."],
  consequences: ["If you cancel late on a booking, penalties in the host policy may apply.", "False statements could affect account standing."],
  disclaimer: AI_LEGAL_DISCLAIMER,
};

export const demoLegalRiskReport = {
  report:
    "Legal Risk Report (demo): 12 legal-context AI events in 7 days. Top themes: thin listing descriptions with photos (4), BNHub date edge cases (2), broker requests under 20 characters (2). Recommend reviewing moderation queue for listings with score <50 readiness and repeat flags.",
  disclaimer: AI_LEGAL_DISCLAIMER,
};
