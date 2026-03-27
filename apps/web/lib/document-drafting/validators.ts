/**
 * Validate that required placeholders are present in context.
 */

export type ValidationResult = { valid: true } | { valid: false; missing: string[] };

export function validateContext(
  context: Record<string, unknown>,
  requiredKeys: string[]
): ValidationResult {
  const missing: string[] = [];
  for (const key of requiredKeys) {
    const val = getNested(context, key);
    if (val === undefined || val === null || val === "") missing.push(key);
  }
  if (missing.length > 0) return { valid: false, missing };
  return { valid: true };
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

export const REQUIRED_BY_DOCUMENT_TYPE: Record<string, string[]> = {
  offer: [
    "property_address",
    "buyer_name",
    "seller_name",
    "offer_price",
    "generated_date",
  ],
  rental_agreement: [
    "property_address",
    "landlord_name",
    "tenant_name",
    "rent_amount",
    "start_date",
    "end_date",
    "generated_date",
  ],
  broker_agreement: [
    "property_address",
    "owner_name",
    "broker_name",
    "broker_license",
    "brokerage_name",
    "start_date",
    "end_date",
    "generated_date",
  ],
  booking_confirmation: [
    "booking_id",
    "guest_name",
    "host_name",
    "booking_start_date",
    "booking_end_date",
    "nights",
    "subtotal",
    "total_amount",
    "generated_date",
  ],
  verification_report: ["property_address", "generated_date"],
  investment_report: ["property_address", "generated_date"],
  transaction_summary: [
    "transaction_id",
    "property_address",
    "buyer_name",
    "seller_name",
    "offer_price",
    "generated_date",
  ],
  dispute_report: ["dispute_id", "booking_id", "description", "generated_date"],
};
