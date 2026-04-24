import { FINANCE_HUB_DISCLAIMERS } from "./finance-admin.types";

/**
 * Describes compliant separation between brokerage sourcing and private exempt investment execution.
 * Wire individual steps to hub ledger + investment compliance services as features mature.
 */
export function describeCompliantMoneyFlow() {
  return {
    brokerage: [
      "Source and negotiate the underlying real estate deal.",
      "Maintain OACIQ disclosures and broker decision attestations on binding actions.",
      "Prepare deal packet for capital sponsor (no mass marketing by default).",
    ],
    investment: [
      "Create / link SPV issuer record (private exempt default).",
      "Onboard only eligibility-recorded investors for the selected exemption path.",
      "Issue legal pack (subscription, memo, risk, questionnaire, exemption representation).",
      "Record commitments and receipts on hub ledger + InvestorCapitalCommitment.",
      "Close exempt financing; schedule Form 45-106F1 filing facts.",
    ],
    moneyTracking: [
      "investor commitment → investor receipt → SPV acquisition payment",
      "legal / notary / AMF fee lines tagged LEGAL / AMF_FEE",
      "distributions as DISTRIBUTION entries in INVESTMENT domain",
    ],
    disclaimers: FINANCE_HUB_DISCLAIMERS,
  };
}
