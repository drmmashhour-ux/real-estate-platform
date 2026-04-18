import type { Deal } from "@prisma/client";
import { evaluateDealFormDependencies } from "@/modules/deals/deal-dependency.service";

export function validateFormKeyDependencies(deal: Deal, formKey: string) {
  return evaluateDealFormDependencies(deal, formKey);
}
