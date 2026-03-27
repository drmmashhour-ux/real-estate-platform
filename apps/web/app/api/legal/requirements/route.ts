import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRequiredForms, type LegalActionContext } from "@/modules/legal/legal-engine";
import { assertLegalAction } from "@/modules/legal/assert-legal";

export const dynamic = "force-dynamic";

function parseAction(sp: URLSearchParams): LegalActionContext | null {
  const c = sp.get("context");
  if (!c) return null;
  switch (c) {
    case "seller_listing": {
      const id = sp.get("fsboListingId")?.trim();
      return id ? { context: "seller_listing", fsboListingId: id } : null;
    }
    case "buyer_contact": {
      const id = sp.get("fsboListingId")?.trim();
      return id ? { context: "buyer_contact", fsboListingId: id } : null;
    }
    case "buyer_offer": {
      const id = sp.get("listingId")?.trim();
      return id ? { context: "buyer_offer", listingId: id } : null;
    }
    case "mortgage_request":
      return { context: "mortgage_request" };
    case "broker_activity":
      return { context: "broker_activity" };
    case "rental_short_booking": {
      const id = sp.get("listingId")?.trim();
      return id ? { context: "rental_short_booking", listingId: id } : null;
    }
    case "rental_short_publish": {
      const id = sp.get("listingId")?.trim();
      return id ? { context: "rental_short_publish", listingId: id } : null;
    }
    case "rental_long": {
      const id = sp.get("listingId")?.trim();
      return id ? { context: "rental_long", listingId: id } : null;
    }
    case "tenant_confirmation": {
      const id = sp.get("listingId")?.trim();
      return id ? { context: "tenant_confirmation", listingId: id } : null;
    }
    default:
      return null;
  }
}

/**
 * GET /api/legal/requirements?context=...&listingId=... — returns missing forms for UI gates.
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required", signedIn: false }, { status: 401 });
  }

  const action = parseAction(req.nextUrl.searchParams);
  if (!action) {
    return NextResponse.json({ error: "Invalid or incomplete context params" }, { status: 400 });
  }

  const required = getRequiredForms(action);
  const result = await assertLegalAction(action, userId);

  return NextResponse.json({
    signedIn: true,
    ok: result.ok,
    required,
    missing: result.missing,
    blockingReasons: result.blockingReasons,
  });
}
