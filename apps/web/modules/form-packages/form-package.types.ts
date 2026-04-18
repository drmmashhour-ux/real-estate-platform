import type { DealExecutionType } from "@prisma/client";

export type FormPackageDefinition = {
  packageKey: string;
  name: string;
  applicableDealTypes: DealExecutionType[];
  requiredDocuments: string[];
  optionalDocuments: string[];
  prerequisiteQuestions: string[];
  validationRules: string[];
  checklistItems: string[];
};
