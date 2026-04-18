import type { BrokerOnboardingScript } from "./broker-onboarding.types";

const CITY = "[CITY]";

/**
 * Live-call / DM scripts for humans. Does not send messages.
 */
export function getBrokerClosingScripts(): BrokerOnboardingScript[] {
  return [
    {
      id: "qualification",
      title: "SCRIPT 1 — Qualification",
      script: "Quick question — how many buyer clients are you currently working with right now?",
    },
    {
      id: "pain",
      title: "SCRIPT 2 — Pain",
      script:
        "Are you actively looking for more qualified buyers or are you already at capacity?",
    },
    {
      id: "offer",
      title: "SCRIPT 3 — Offer",
      script: `We're sending serious buyer leads in ${CITY}. Some brokers are already closing deals.

You only pay per opportunity — no upfront cost.`,
    },
    {
      id: "close",
      title: "SCRIPT 4 — Close",
      script: `I can send you 2–3 leads this week so you can test it. If it works, we scale.

Does that sound fair?`,
    },
    {
      id: "objection",
      title: "SCRIPT 5 — Objection",
      script:
        "I understand — that's exactly why we start small. You only pay if you see value.",
    },
  ];
}
