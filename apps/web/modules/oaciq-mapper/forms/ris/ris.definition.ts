import type { FormDefinition } from "../../form-definition.types";

export const risDefinition: FormDefinition = {
  formKey: "RIS",
  officialCode: "RIS",
  title: "Request for information — syndicate of co-owners — specimen mapping",
  mandatoryOrRecommended: "conditional",
  versionLabel: "mapper-v1",
  principalOrRelated: "related",
  baseWorkflow: "divided_coownership",
  sections: [
    {
      sectionKey: "ris.s1",
      sectionLabel: "Syndicate & recipient",
      order: 1,
      fields: [
        { fieldKey: "ris.s1.syndicateId", label: "Syndicate identification", fieldType: "textarea", required: true, sourcePaths: ["deal.coownership.syndicateName", "deal.coownership.syndicateId"], displayGroup: "syndicate", validationRuleRefs: [] },
        { fieldKey: "ris.s1.brokerRecipient", label: "Broker / agency recipient", fieldType: "text", required: false, sourcePaths: ["deal.broker.agencyName", "deal.broker.email"], displayGroup: "recipient", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "ris.s2",
      sectionLabel: "Immovable identification",
      order: 2,
      fields: [
        { fieldKey: "ris.s2.immovable", label: "Immovable identification", fieldType: "textarea", required: true, sourcePaths: ["deal.immovable.fullAddress", "deal.immovable.cadastralDescription"], displayGroup: "immovable", validationRuleRefs: [] },
        { fieldKey: "ris.s2.ownerAuth", label: "Owner authorization", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.ownerAuthorization"], displayGroup: "immovable", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "ris.s3",
      sectionLabel: "Financials — common expenses & charges",
      order: 3,
      fields: [
        { fieldKey: "ris.s3.monthlyCommonExpenses", label: "Monthly common expenses", fieldType: "currency", required: false, sourcePaths: ["deal.coownership.monthlyCommonExpenses"], displayGroup: "fin", validationRuleRefs: [] },
        { fieldKey: "ris.s3.outstandingChargesYesNo", label: "Outstanding charges (yes/no)", fieldType: "boolean", required: false, sourcePaths: ["deal.coownership.outstandingChargesYesNo"], displayGroup: "fin", validationRuleRefs: ["ris.charges_detail"] },
        { fieldKey: "ris.s3.outstandingChargesAmount", label: "Outstanding charges amount", fieldType: "currency", required: false, sourcePaths: ["deal.coownership.outstandingChargesAmount"], displayGroup: "fin", validationRuleRefs: ["ris.charges_detail"] },
        { fieldKey: "ris.s3.outstandingChargesRate", label: "Interest rate (if applicable)", fieldType: "text", required: false, sourcePaths: ["deal.coownership.outstandingChargesRate"], displayGroup: "fin", validationRuleRefs: ["ris.charges_detail"] },
        { fieldKey: "ris.s3.votedContributions", label: "Voted or expected contributions", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.votedContributions"], displayGroup: "fin", validationRuleRefs: [] },
        { fieldKey: "ris.s3.contingencyFund", label: "Contingency fund amount", fieldType: "currency", required: false, sourcePaths: ["deal.coownership.contingencyFund"], displayGroup: "fin", validationRuleRefs: [] },
        { fieldKey: "ris.s3.deficitSurplus", label: "Deficit / surplus indicators", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.deficitSurplus"], displayGroup: "fin", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "ris.s4",
      sectionLabel: "Litigation / insurance / claims",
      order: 4,
      fields: [
        { fieldKey: "ris.s4.litigation", label: "Litigation / judgment", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.litigation"], displayGroup: "legal", validationRuleRefs: [] },
        { fieldKey: "ris.s4.insuranceClaims", label: "Insurance / claims", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.insuranceClaims"], displayGroup: "legal", validationRuleRefs: [] },
        { fieldKey: "ris.s4.additionalFees", label: "Additional fees", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.additionalFees"], displayGroup: "legal", validationRuleRefs: [] },
        { fieldKey: "ris.s4.declarationViolation", label: "Notice of declaration violation", fieldType: "boolean", required: false, sourcePaths: ["deal.coownership.declarationViolation"], displayGroup: "legal", validationRuleRefs: [] },
        { fieldKey: "ris.s4.unauthorizedWork", label: "Unauthorized work impacts", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.unauthorizedWork"], displayGroup: "legal", validationRuleRefs: [] },
        { fieldKey: "ris.s4.valueExpenseFactors", label: "Factors reducing value / increasing expenses", fieldType: "textarea", required: false, sourcePaths: ["deal.coownership.valueExpenseFactors"], displayGroup: "legal", validationRuleRefs: [] },
      ],
    },
  ],
  dependencies: [
    { ruleId: "ris.coownership", description: "Linked to divided co-ownership / syndicate workflows", dependsOnFormKeys: ["PP"] },
  ],
  validationRules: [
    { ruleId: "ris.charges_detail", description: "If outstanding charges yes, amount/rate should be reviewed" },
  ],
  previewOrder: ["ris.s1", "ris.s2", "ris.s3", "ris.s4"],
};
