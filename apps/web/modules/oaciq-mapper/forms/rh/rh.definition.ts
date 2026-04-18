import type { FormDefinition } from "../../form-definition.types";

export const rhDefinition: FormDefinition = {
  formKey: "RH",
  officialCode: "RH",
  title: "Request for information — hypothecary loan — specimen mapping",
  mandatoryOrRecommended: "conditional",
  versionLabel: "mapper-v1",
  principalOrRelated: "related",
  baseWorkflow: "existing_loan_review",
  sections: [
    {
      sectionKey: "rh.h1",
      sectionLabel: "Financial institution & broker",
      order: 1,
      fields: [
        { fieldKey: "rh.h1.institution", label: "Financial institution identification", fieldType: "text", required: true, sourcePaths: ["deal.loanInfo.institutionName"], displayGroup: "inst", validationRuleRefs: [] },
        { fieldKey: "rh.h1.brokerRecipient", label: "Broker recipient", fieldType: "text", required: false, sourcePaths: ["deal.broker.agencyName"], displayGroup: "inst", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "rh.h2",
      sectionLabel: "Immovable & owner authorization",
      order: 2,
      fields: [
        { fieldKey: "rh.h2.immovable", label: "Immovable identification", fieldType: "textarea", required: true, sourcePaths: ["deal.immovable.fullAddress"], displayGroup: "immovable", validationRuleRefs: [] },
        { fieldKey: "rh.h2.ownerAuth", label: "Owner authorization", fieldType: "textarea", required: false, sourcePaths: ["deal.loanInfo.ownerAuthorization"], displayGroup: "immovable", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "rh.h3",
      sectionLabel: "Loan terms",
      order: 3,
      fields: [
        { fieldKey: "rh.h3.originalAmount", label: "Original loan amount", fieldType: "currency", required: false, sourcePaths: ["deal.loanInfo.originalAmount"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.firstInstalmentDate", label: "First instalment date", fieldType: "date", required: false, sourcePaths: ["deal.loanInfo.firstInstalmentDate"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.lastInstalmentDate", label: "Last instalment date", fieldType: "date", required: false, sourcePaths: ["deal.loanInfo.lastInstalmentDate"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.balance", label: "Balance", fieldType: "currency", required: false, sourcePaths: ["deal.loanInfo.balance", "deal.financing.existingLoanBalance"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.instalments", label: "Instalments", fieldType: "text", required: false, sourcePaths: ["deal.loanInfo.instalments"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.rate", label: "Rate", fieldType: "text", required: false, sourcePaths: ["deal.loanInfo.rate"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.maturity", label: "Maturity", fieldType: "date", required: false, sourcePaths: ["deal.loanInfo.maturity"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.amortizationTerm", label: "Amortization / term", fieldType: "text", required: false, sourcePaths: ["deal.loanInfo.amortizationTerm"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.earlyRepayment", label: "Early repayment", fieldType: "textarea", required: false, sourcePaths: ["deal.loanInfo.earlyRepayment"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.penalties", label: "Penalties", fieldType: "textarea", required: false, sourcePaths: ["deal.loanInfo.penalties"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.assumableYesNo", label: "Assumable (yes/no)", fieldType: "boolean", required: false, sourcePaths: ["deal.loanInfo.assumableYesNo"], displayGroup: "loan", validationRuleRefs: ["rh.assumable_conditions"] },
        { fieldKey: "rh.h3.assumableConditions", label: "Assumability conditions", fieldType: "textarea", required: false, sourcePaths: ["deal.loanInfo.assumableConditions"], displayGroup: "loan", validationRuleRefs: ["rh.assumable_conditions"] },
        { fieldKey: "rh.h3.lineOfCredit", label: "Line of credit", fieldType: "boolean", required: false, sourcePaths: ["deal.loanInfo.lineOfCredit"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.securedCreditCard", label: "Secured credit card", fieldType: "boolean", required: false, sourcePaths: ["deal.loanInfo.securedCreditCard"], displayGroup: "loan", validationRuleRefs: [] },
        { fieldKey: "rh.h3.institutionSignaturePlaceholder", label: "Institution signature block (placeholder)", fieldType: "signature_placeholder", required: false, sourcePaths: [], displayGroup: "signatures", validationRuleRefs: [], notes: "Preview only" },
      ],
    },
  ],
  dependencies: [
    { ruleId: "rh.financing", description: "Linked when existing loan / financing review needed", dependsOnFormKeys: ["PP"] },
  ],
  validationRules: [
    { ruleId: "rh.assumable_conditions", description: "If assumable yes, conditions should be specified" },
  ],
  previewOrder: ["rh.h1", "rh.h2", "rh.h3"],
};
