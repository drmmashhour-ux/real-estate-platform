import type { Deal } from "@prisma/client";
import { mapDealToTemplateFields } from "./field-mapper.service";

export function buildPackagePrefill(deal: Deal, templateKey: string) {
  return mapDealToTemplateFields(deal, templateKey);
}
