import type { DealChecklistItem } from "./deal.types";
import { getFormPackageByKey } from "../form-packages/form-package.service";

export function buildChecklistForPackage(packageKey: string | null | undefined): DealChecklistItem[] {
  const pkg = packageKey ? getFormPackageByKey(packageKey) : null;
  if (!pkg) {
    return [
      { id: "confirm_deal_type", label: "Confirm deal type and co-ownership context with parties", done: false, required: true },
      { id: "official_forms", label: "Obtain correct official OACIQ forms from the publisher", done: false, required: true },
      { id: "broker_review", label: "Broker review of all material terms before signing", done: false, required: true },
    ];
  }
  return pkg.checklistItems.map((label, i) => ({
    id: `pkg_${pkg.packageKey}_${i}`,
    label,
    done: false,
    required: true,
  }));
}
