/**
 * Valuation service: delegates to web-app API or implements minimal logic for standalone runs.
 * In production, call the platform API (e.g. POST /api/valuation/sale) with property data.
 */

import type { PropertyInput, ValuationType } from "../models/types.js";

const PLATFORM_API_BASE = process.env.PLATFORM_API_BASE || "http://localhost:3000";

export async function requestValuation(
  type: ValuationType,
  propertyIdentityId: string,
  listingId?: string | null
): Promise<{ valuationId: string; result: unknown }> {
  const path =
    type === "sale"
      ? "/api/valuation/sale"
      : type === "long_term_rental"
        ? "/api/valuation/long-term-rent"
        : type === "short_term_rental"
          ? "/api/valuation/short-term-rent"
          : "/api/valuation/investment";
  const res = await fetch(`${PLATFORM_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      property_identity_id: propertyIdentityId,
      listing_id: listingId ?? undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Valuation request failed: ${res.status}`);
  }
  const data = (await res.json()) as { valuation_id: string; result: unknown };
  return { valuationId: data.valuation_id, result: data.result };
}
