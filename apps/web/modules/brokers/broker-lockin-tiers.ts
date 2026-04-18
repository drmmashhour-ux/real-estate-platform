import type { BrokerLockInTierId } from "./broker-lockin.types";

/** Display rules — routing policy is enforced elsewhere; this is operator-facing transparency. */
export const BROKER_LOCKIN_TIER_RULES: Record<
  BrokerLockInTierId,
  { label: string; summary: string; rules: string[] }
> = {
  ELITE: {
    label: "Elite",
    summary: "Fastest response, strongest outcomes proxy, first access to best-fit demand.",
    rules: ["Fastest response", "Highest close-rate proxy", "Gets best leads (governance-approved)"],
  },
  PREFERRED: {
    label: "Preferred",
    summary: "Solid performance — steady lead flow when capacity allows.",
    rules: ["Good performance", "Steady leads"],
  },
  STANDARD: {
    label: "Standard",
    summary: "Entry / limited access until performance and responsiveness improve.",
    rules: ["Limited access"],
  },
};
