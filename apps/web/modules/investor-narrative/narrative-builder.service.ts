import type { InvestorNarrativeBlocks } from "./investor-narrative.types";
import { getStandardRiskDisclosures } from "./risk-disclosure.service";

export function buildInvestorNarrativeBlocks(): InvestorNarrativeBlocks {
  return {
    whyNow: "Operators still run STR and resale on disconnected stacks while clients expect trust, receipts, and explainable fees.",
    whyMontreal: "Single dense bilingual market to prove supply + compliance workflows before multi-city rollout.",
    problem: "Fragmented CRM, stays tooling, and document workflows reduce execution quality and auditability.",
    differentiation: "LECIPM unifies BNHub hospitality rails with residential brokerage OS — AI drafts are review-first; money movement stays on Stripe.",
    whyScales: "Phased city launch reuses the same workflow engine; network effects compound with broker teams and host supply in each micro-market.",
    revenueEarly: "Configured take rates on BNHub activity plus brokerage subscriptions and lead/success economics — see simulation (estimated).",
    moat: "Execution + compliance depth (OACIQ-aligned patterns where applicable) + marketplace liquidity loops — not a thin CRUD wrapper.",
    risks: getStandardRiskDisclosures().join(" "),
  };
}
