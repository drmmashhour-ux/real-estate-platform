import type { Deal } from "@prisma/client";
import { buildPackagePrefill } from "./package-prefill.service";

/**
 * Residential brokerage prefill — maps deal snapshot into template field keys (draft only).
 */
export function buildResidentialPackagePrefill(deal: Deal, templateKey: string) {
  return buildPackagePrefill(deal, templateKey);
}
