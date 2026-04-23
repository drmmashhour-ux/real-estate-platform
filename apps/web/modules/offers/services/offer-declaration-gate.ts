import { NextResponse } from "next/server";
import { complianceFlags } from "@/config/feature-flags";
import {
  loadListingDeclarationComplianceInput,
  validateListingCompliance,
} from "@/modules/legal/compliance/listing-declaration-compliance.service";

const DEMO_LISTING_IDS = new Set(["1", "test-listing-1", "demo-listing-montreal"]);

/**
 * When `FEATURE_SELLER_DECLARATION_COMPLIANCE_GATE_V1` is on, block offers if declaration is missing or incomplete.
 * Explicit seller refusal remains allowed (buyer must be informed on the listing).
 */
export async function maybeBlockOfferForDeclaration(listingId: string): Promise<NextResponse | null> {
  if (!complianceFlags.sellerDeclarationComplianceGateV1 || !listingId) return null;
  if (DEMO_LISTING_IDS.has(listingId)) return null;
  const dec = await loadListingDeclarationComplianceInput(listingId);
  const c = validateListingCompliance(dec);
  if (!c.allowed) {
    return NextResponse.json(
      {
        error: "CANNOT_SUBMIT_OFFER_DECLARATION_REQUIRED",
        reason: c.reason,
      },
      { status: 403 }
    );
  }
  return null;
}
