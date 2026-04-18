import type { Deal } from "@prisma/client";
import { getFormPackageByKey } from "@/modules/form-packages/form-package.service";
import { suggestWorkflowPackage } from "@/modules/form-packages/workflow-matcher.service";
import { analyzeDeal } from "./deal-analyzer.service";

export type InferredDocumentRequirement = {
  packageKey: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  disclaimer: string;
};

/**
 * Infers likely OACIQ-oriented package + document labels from deal metadata (assistance only).
 */
export function inferDocumentRequirements(deal: Deal, parties: { id: string }[]): InferredDocumentRequirement {
  const analysis = analyzeDeal(deal, parties);
  const hinted = suggestWorkflowPackage(deal);
  const pkg = getFormPackageByKey(hinted.packageKey);

  return {
    packageKey: hinted.packageKey,
    requiredDocuments: pkg?.requiredDocuments ?? [],
    optionalDocuments: pkg?.optionalDocuments ?? [],
    disclaimer: `${hinted.disclaimer} Execution profile: ${analysis.executionType ?? "unspecified"} — confirm against current OACIQ instructions.`,
  };
}
