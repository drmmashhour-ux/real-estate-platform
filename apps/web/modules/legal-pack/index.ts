import type { AmfExemptionCategory } from "@prisma/client";
import { LEGAL_PACK_VERSION } from "./legal-pack.templates";
import { generateExemptionRepresentationMarkdown } from "./exemption-representation.generator";
import { generateInvestorMemoMarkdown } from "./investor-memo.generator";
import { generateInvestorQuestionnaireMarkdown } from "./investor-questionnaire.generator";
import { generateRiskDisclosureMarkdown } from "./risk-disclosure.generator";
import { generateSubscriptionAgreementMarkdown } from "./subscription-agreement.generator";

export * from "./legal-pack.templates";
export { generateSubscriptionAgreementMarkdown } from "./subscription-agreement.generator";
export { generateInvestorMemoMarkdown } from "./investor-memo.generator";
export { generateRiskDisclosureMarkdown } from "./risk-disclosure.generator";
export { generateInvestorQuestionnaireMarkdown } from "./investor-questionnaire.generator";
export { generateExemptionRepresentationMarkdown } from "./exemption-representation.generator";

export type LegalPackInput = {
  spvIssuerName: string;
  dealSummary: string;
  exemption: AmfExemptionCategory;
  investorLegalName?: string;
  subscribedAmount?: string;
  securityType?: string;
};

export function generateFullLegalPack(input: LegalPackInput) {
  const investor = input.investorLegalName ?? "[Investor legal name]";
  const amount = input.subscribedAmount ?? "[Amount]";
  const security = input.securityType ?? "[Class / series of securities]";

  const subscription = generateSubscriptionAgreementMarkdown({
    spvIssuerLegalName: input.spvIssuerName,
    investorIdentity: investor,
    subscribedAmount: amount,
    securityType: security,
    closingConditions: "Subject to counsel-approved closing deliverables, KYC, and funds received in cleared funds.",
    investorRepresentations:
      "Investor represents that information provided is accurate and acknowledges private placement status.",
    governingLaw: "Province of Québec (subject to issuer counsel review).",
    brokerConflictNote:
      "Disclose any broker interest, referral fees, or dual roles as required by applicable brokerage rules.",
  });

  const memo = generateInvestorMemoMarkdown({
    dealSummary: input.dealSummary,
    acquisitionThesis: "[Thesis to be completed by issuer.]",
    risks: "[Material risks to be completed — illiquidity, loss of capital, execution, financing, regulatory.]",
    useOfProceeds: "[Use of proceeds schedule.]",
    capitalStack: "[Illustrative stack — subject to final legal agreements.]",
    esgRetrofitSummary: "[Optional ESG / retrofit narrative.]",
    conflictsDisclosure: "[Issuer / sponsor / broker conflicts to be listed.]",
  });

  const risk = generateRiskDisclosureMarkdown({
    illiquidity: "Investors should assume limited or no secondary market.",
    lossOfCapital: "Investors may lose their entire investment.",
    executionRisk: "Business plan execution may differ materially from projections.",
    financingRisk: "Additional financing may be unavailable on acceptable terms.",
    marketRisk: "Market conditions may affect valuations and exit timing.",
    constructionRetrofitRisk: "Construction or retrofit costs and timelines may overrun.",
    regulatoryRisk: "Changes in law or regulatory interpretation may adversely affect the issuer.",
  });

  const questionnaire = generateInvestorQuestionnaireMarkdown({
    accreditedBlock:
      "☐ I qualify as an accredited investor under applicable securities laws (verify definitions with counsel).",
    ffbaBlock:
      "☐ I confirm a pre-existing close relationship with principals as required for the FFBA exemption path (counsel to verify).",
    jurisdiction: "Province / country of residence: ______________",
    sophisticationAck:
      "I understand this is a speculative private investment and I am not relying on the platform for advice.",
  });

  const representation = generateExemptionRepresentationMarkdown({
    exemptionReliedUpon: input.exemption,
    qualificationConfirm: "I confirm I meet the eligibility criteria for the exemption stated above.",
    independentDecisionConfirm:
      "I am making an independent investment decision and have consulted my own professional advisors as needed.",
  });

  return {
    version: LEGAL_PACK_VERSION,
    documents: {
      subscriptionAgreement: { title: "Subscription Agreement", markdown: subscription },
      investorMemo: { title: "Investor Memo", markdown: memo },
      riskDisclosure: { title: "Risk Disclosure", markdown: risk },
      investorQuestionnaire: { title: "Investor Questionnaire", markdown: questionnaire },
      exemptionRepresentation: { title: "Exemption Representation", markdown: representation },
    },
  };
}
