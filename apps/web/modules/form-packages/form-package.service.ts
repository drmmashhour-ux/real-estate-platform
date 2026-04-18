import type { DealExecutionType } from "@prisma/client";
import type { FormPackageDefinition } from "./form-package.types";

const PACKAGES: FormPackageDefinition[] = [
  {
    packageKey: "promise_to_purchase_residential_qc",
    name: "Promise to Purchase — residential (Quebec)",
    applicableDealTypes: ["residential_sale", "purchase_brokerage"],
    requiredDocuments: ["Official Promise to Purchase (publisher form)", "Declarations / schedules as required"],
    optionalDocuments: ["Inspection annex", "Financing condition schedule"],
    prerequisiteQuestions: ["Is the immovable divided co-ownership?", "Occupancy / possession date agreed?"],
    validationRules: ["Price and deposit must align across schedules", "Party identities consistent with brokerage records"],
    checklistItems: [
      "Confirm official Promise to Purchase form version from publisher",
      "Verify inclusions/exclusions and financial conditions",
      "Broker review before presentation / signing",
    ],
  },
  {
    packageKey: "exclusive_brokerage_sale_qc",
    name: "Exclusive Brokerage Contract — Sale (Quebec)",
    applicableDealTypes: ["sale_brokerage", "residential_sale", "income_property"],
    requiredDocuments: ["Official exclusive brokerage contract (sale)", "Mandate scope and marketing terms"],
    optionalDocuments: ["Co-listing / referral annex"],
    prerequisiteQuestions: ["Mandate duration and remuneration agreed?"],
    validationRules: ["Mandate aligns with listing authority"],
    checklistItems: ["Confirm official brokerage contract version", "Brokerage compensation and protections reviewed"],
  },
  {
    packageKey: "divided_coownership_sale_qc",
    name: "Co-ownership sale package (Quebec)",
    applicableDealTypes: ["divided_coownership_sale"],
    requiredDocuments: ["Declaration of co-ownership excerpts as applicable", "Syndicate / minutes references if required"],
    optionalDocuments: ["Special assessments schedule", "Parking / storage annex"],
    prerequisiteQuestions: ["Condo fees / special contribution status?"],
    validationRules: ["Co-ownership identifiers consistent across annexes"],
    checklistItems: ["Review syndicate documents access", "Confirm official forms for divided co-ownership context"],
  },
  {
    packageKey: "amendment_counter_qc",
    name: "Amendment / counter-proposal package",
    applicableDealTypes: ["amendment", "counter_proposal"],
    requiredDocuments: ["Amendment or counter-proposal per official workflow"],
    optionalDocuments: [],
    prerequisiteQuestions: ["Which prior agreement is being amended?"],
    validationRules: ["Cross-reference prior agreement identifiers and dates"],
    checklistItems: ["Link amendment to prior accepted instrument", "Broker review of all changes"],
  },
];

const byKey = new Map(PACKAGES.map((p) => [p.packageKey, p]));

export function listFormPackages(): FormPackageDefinition[] {
  return PACKAGES;
}

export function getFormPackageByKey(key: string): FormPackageDefinition | null {
  return byKey.get(key) ?? null;
}

export function findPackagesForDealType(dealType: DealExecutionType | null): FormPackageDefinition[] {
  if (!dealType) return PACKAGES;
  return PACKAGES.filter((p) => p.applicableDealTypes.includes(dealType));
}
