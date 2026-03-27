import type { RequiredDocumentItem } from "@prisma/client";

export type ChecklistProgress = {
  totalItems: number;
  requiredMandatoryCount: number;
  approvedMandatoryCount: number;
  pendingMandatoryCount: number;
  rejectedMandatoryCount: number;
  waivedMandatoryCount: number;
  /** All items (including optional) for display counts */
  approvedItems: number;
  pendingItems: number;
  rejectedItems: number;
  waivedItems: number;
  /** 0–100 based on mandatory items only */
  percentComplete: number;
};

function isActiveItem(item: Pick<RequiredDocumentItem, "deletedAt">): boolean {
  return item.deletedAt == null;
}

/**
 * Progress is based on mandatory items: approved + waived count as "done" for the bar.
 * Pending = mandatory items not yet approved or waived (includes REQUIRED, REQUESTED, UPLOADED, UNDER_REVIEW, REJECTED).
 */
export function calculateChecklistProgress(
  items: Pick<RequiredDocumentItem, "isMandatory" | "status" | "deletedAt">[]
): ChecklistProgress {
  const active = items.filter(isActiveItem);

  const mandatory = active.filter((i) => i.isMandatory);
  const requiredMandatoryCount = mandatory.length;

  let approvedMandatoryCount = 0;
  let pendingMandatoryCount = 0;
  let rejectedMandatoryCount = 0;
  let waivedMandatoryCount = 0;

  for (const m of mandatory) {
    switch (m.status) {
      case "APPROVED":
        approvedMandatoryCount += 1;
        break;
      case "WAIVED":
        waivedMandatoryCount += 1;
        break;
      case "REJECTED":
        rejectedMandatoryCount += 1;
        pendingMandatoryCount += 1;
        break;
      default:
        pendingMandatoryCount += 1;
    }
  }

  let approvedItems = 0;
  let pendingItems = 0;
  let rejectedItems = 0;
  let waivedItems = 0;

  for (const i of active) {
    switch (i.status) {
      case "APPROVED":
        approvedItems += 1;
        break;
      case "WAIVED":
        waivedItems += 1;
        break;
      case "REJECTED":
        rejectedItems += 1;
        pendingItems += 1;
        break;
      default:
        pendingItems += 1;
    }
  }

  const doneMandatory = approvedMandatoryCount + waivedMandatoryCount;
  const percentComplete =
    requiredMandatoryCount === 0
      ? active.length === 0
        ? 100
        : Math.round((100 * (approvedItems + waivedItems)) / active.length)
      : Math.round((100 * doneMandatory) / requiredMandatoryCount);

  return {
    totalItems: active.length,
    requiredMandatoryCount,
    approvedMandatoryCount,
    pendingMandatoryCount,
    rejectedMandatoryCount,
    waivedMandatoryCount,
    approvedItems,
    pendingItems,
    rejectedItems,
    waivedItems,
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
  };
}
