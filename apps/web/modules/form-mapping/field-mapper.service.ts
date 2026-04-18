import type { Deal } from "@prisma/client";
import type { FieldMapResult } from "./form-mapping.types";

/**
 * Maps internal deal data to logical field keys for prefill assistance.
 * Keys are descriptive — map to official PDF fields only using publisher field names at render time.
 */
export function mapDealToTemplateFields(deal: Deal, templateKey: string): FieldMapResult {
  const warnings: string[] = [];
  const missing: string[] = [];
  const meta = (deal.executionMetadata && typeof deal.executionMetadata === "object" ? deal.executionMetadata : {}) as Record<
    string,
    unknown
  >;

  if (!meta.possessionDate) missing.push("possessionDate");
  if (!meta.depositCents && !deal.priceCents) missing.push("priceOrDeposit");

  const mappedFields: Record<string, unknown> = {
    immovable_reference: deal.propertyReferenceId ?? deal.listingCode ?? "",
    price_cents: deal.priceCents,
    buyer_display: "See brokerage records — verify identities on official form",
    seller_display: "See brokerage records — verify identities on official form",
    jurisdiction: deal.jurisdiction ?? "QC",
  };

  warnings.push("Verify all mapped values against source documents before transferring to official forms.");

  return {
    templateKey,
    mappedFields,
    missingRequiredFields: missing,
    warnings,
  };
}
