import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { adminSearchIdentityNetwork } from "@/lib/identity-network";
import type { IdentitySearchType } from "@/lib/identity-network";

/**
 * GET /api/admin/identity-network/search
 * Query: q (required), type=property|owner|broker|organization, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = (searchParams.get("type") ?? "property") as IdentitySearchType;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    if (!q) return Response.json({ error: "q required" }, { status: 400 });
    const validTypes: IdentitySearchType[] = ["property", "owner", "broker", "organization"];
    if (!validTypes.includes(type)) {
      return Response.json({ error: "type must be property, owner, broker, or organization" }, { status: 400 });
    }

    const result = await adminSearchIdentityNetwork({ q, type, limit });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
