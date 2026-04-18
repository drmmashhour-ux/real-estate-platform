import type { Deal } from "@prisma/client";
import { buildChecklistForPackage } from "@/modules/deals/deal-checklist.service";

export function residentialChecklistPrompts(deal: Deal) {
  const items = buildChecklistForPackage(deal.assignedFormPackageKey);
  return items.map((i) => ({
    id: i.id,
    label: i.label,
    required: i.required,
  }));
}
