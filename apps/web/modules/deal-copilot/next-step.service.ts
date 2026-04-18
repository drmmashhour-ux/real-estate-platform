import type { Deal } from "@prisma/client";

export function suggestNextStep(deal: Deal): { title: string; detail: string } {
  if (!deal.dealExecutionType) {
    return { title: "Set execution profile", detail: "Choose deal execution type and confirm parties in metadata." };
  }
  if (!deal.assignedFormPackageKey) {
    return { title: "Confirm form package", detail: "Align with official OACIQ package for this transaction." };
  }
  return { title: "Advance transaction", detail: "Update milestones and attach official executed instruments when available." };
}
