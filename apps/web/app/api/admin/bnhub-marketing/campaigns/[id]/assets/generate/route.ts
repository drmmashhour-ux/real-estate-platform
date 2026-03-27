import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { generateAssetPackFromListing } from "@/src/modules/bnhub-marketing/services/marketingAssetService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { langs?: ("en" | "fr")[] };
    const assets = await generateAssetPackFromListing(id, body.langs ?? ["en", "fr"]);
    return Response.json({ count: assets.length, assets });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
