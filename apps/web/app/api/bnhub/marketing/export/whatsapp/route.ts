import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  assertListingMarketingAccess,
  MarketingAuthError,
} from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { exportWhatsappPromo } from "@/src/modules/bnhub-marketing/services/distributionService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });
    await assertListingMarketingAccess(userId, listingId);
    const baseUrl =
      request.nextUrl.searchParams.get("baseUrl") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      undefined;
    const text = await exportWhatsappPromo(listingId, baseUrl);
    return Response.json({ text, label: "WhatsApp promo pack (plain text)" });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const status = e.code === "UNAUTHORIZED" ? 401 : e.code === "NOT_FOUND" ? 404 : 403;
      return Response.json({ error: e.message }, { status });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
