/**
 * Named export bundles for syndic / OACIQ-style inspection and regulator handoff.
 * Use `bundleType` on `ComplianceExportBundle` or manifest.profile keys.
 */
export const REGULATOR_EXPORT_PROFILES = {
  oaciq_inspection: {
    label: "OACIQ inspection pack",
    defaultModules: ["audit", "contracts", "declarations", "complaints", "risk"],
  },
  complaint_dossier: {
    label: "Complaint dossier",
    defaultModules: ["complaints", "audit"],
  },
  trust_review: {
    label: "Trust account review",
    defaultModules: ["trust", "audit", "financial"],
  },
  financial_register: {
    label: "Financial register excerpt",
    defaultModules: ["financial", "audit"],
  },
} as const;

export type RegulatorReportSectionKey =
  | "audit"
  | "complaints"
  | "trust"
  | "financial"
  | "contracts"
  | "declarations"
  | "risk";

export const REGULATOR_FULL_REPORT_SECTIONS: RegulatorReportSectionKey[] = [
  "audit",
  "complaints",
  "trust",
  "financial",
  "contracts",
  "declarations",
  "risk",
];
