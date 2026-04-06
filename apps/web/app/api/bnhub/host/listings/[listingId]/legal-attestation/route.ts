import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY } from "@/lib/bnhub/legal-rent-attestation-policy";
import { recordLegalRentRightAttestation } from "@/lib/bnhub/legal-rent-attestation";

function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

/**
 * POST — Host confirms legal right to offer the stay (after platform ownership verification).
 * Body: { confirm: true }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const { listingId } = await params;
    const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
    if (body.confirm !== true) {
      return Response.json({ error: "confirm: true is required" }, { status: 400 });
    }

    const result = await recordLegalRentRightAttestation(listingId, userId, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    if (!result.ok) {
      const status = result.error === "Forbidden" ? 403 : result.error === "Listing not found" ? 404 : 400;
      return Response.json({ error: result.error }, { status });
    }

    return Response.json({ ok: true, summary: LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY });
  } catch (e) {
    console.error("POST /api/bnhub/host/listings/[listingId]/legal-attestation:", e);
    return Response.json({ error: "Failed to record attestation" }, { status: 500 });
  }
}
