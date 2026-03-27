import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getRequiredContracts,
  getRequiredDisclosures,
  getRequiredDocuments,
  getRequiredLegalSteps,
  mapRulesToAction,
  validateLegalReadiness,
  type LegalRulesContext,
} from "@/modules/legal/rules";

export const dynamic = "force-dynamic";

function parseRulesContext(sp: URLSearchParams): LegalRulesContext | null {
  const kind = sp.get("kind")?.trim();
  if (!kind) return null;
  switch (kind) {
    case "buyer_contact": {
      const fsboListingId = sp.get("fsboListingId")?.trim();
      return fsboListingId ? { kind: "buyer_contact", fsboListingId } : null;
    }
    case "buyer_offer": {
      const listingId = sp.get("listingId")?.trim();
      return listingId ? { kind: "buyer_offer", listingId } : null;
    }
    case "seller_publish": {
      const fsboListingId = sp.get("fsboListingId")?.trim();
      return fsboListingId ? { kind: "seller_publish", fsboListingId } : null;
    }
    case "landlord_publish": {
      const listingId = sp.get("listingId")?.trim();
      return listingId ? { kind: "landlord_publish", listingId } : null;
    }
    case "host_publish": {
      const listingId = sp.get("listingId")?.trim();
      return listingId ? { kind: "host_publish", listingId } : null;
    }
    case "rental_booking": {
      const listingId = sp.get("listingId")?.trim();
      const mode = sp.get("mode") === "long_term_tenant" ? "long_term_tenant" : "short_term_guest";
      return listingId ? { kind: "rental_booking", listingId, mode } : null;
    }
    case "broker_lead_access":
      return { kind: "broker_lead_access" };
    case "mortgage_request":
      return { kind: "mortgage_request" };
    default:
      return null;
  }
}

/**
 * GET /api/legal/rules?kind=buyer_contact&... — legal steps, documents, disclosures, and readiness (signed-in).
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const ctx = parseRulesContext(req.nextUrl.searchParams);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid kind or missing params" }, { status: 400 });
  }

  const steps = getRequiredLegalSteps(ctx);
  const contracts = getRequiredContracts(ctx);
  const disclosures = getRequiredDisclosures(ctx);
  const documents = getRequiredDocuments(ctx);
  const mappedAction = mapRulesToAction(ctx);

  let readiness = null;
  if (userId) {
    readiness = await validateLegalReadiness(ctx, userId);
  }

  return NextResponse.json({
    context: ctx,
    mappedLegalAction: mappedAction,
    steps,
    contracts,
    disclosures,
    documents,
    readiness,
    signedIn: Boolean(userId),
  });
}
