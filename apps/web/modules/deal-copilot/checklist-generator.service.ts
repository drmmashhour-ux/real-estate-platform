import type { Deal } from "@prisma/client";
import { buildChecklistForPackage } from "../deals/deal-checklist.service";

export function generateExecutionChecklist(deal: Deal) {
  return buildChecklistForPackage(deal.assignedFormPackageKey);
}
