import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assignNotaryToPackage } from "@/lib/notary-closing";

/**
 * POST /api/notary-closing/assign-notary
 * Body: { packageId: string, notaryId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { packageId, notaryId } = body;
    if (!packageId || !notaryId) {
      return Response.json({ error: "packageId and notaryId required" }, { status: 400 });
    }

    const pkg = await assignNotaryToPackage(packageId, notaryId);
    return Response.json(pkg);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to assign notary";
    return Response.json({ error: message }, { status: 400 });
  }
}
