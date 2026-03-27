import type { ModelValidationItem } from "@prisma/client";
import { analyzeClusters } from "@/modules/model-validation/infrastructure/disagreementClusterService";
import type { ClusterAnalysis } from "../domain/tuning.types";

export function analyzeDisagreementClusters(items: ModelValidationItem[]): ClusterAnalysis[] {
  return analyzeClusters(items);
}
