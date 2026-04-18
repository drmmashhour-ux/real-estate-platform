import type { DealExecutionType } from "@prisma/client";
import { findPackagesForDealType } from "./form-package.service";

export function isPackageEligibleForDealType(packageKey: string, dealType: DealExecutionType | null): boolean {
  const pkgs = findPackagesForDealType(dealType);
  return pkgs.some((p) => p.packageKey === packageKey);
}
