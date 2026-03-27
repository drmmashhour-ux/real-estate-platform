import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getApprovedHost, acceptHostAgreement, getHostAgreement, hasAcceptedHostAgreement } from "@/lib/bnhub/host";

/**
 * GET /api/bnhub/host-agreement — Current host agreement status.
 * Returns { accepted: boolean, acceptedAt?: string, version?: string }.
 * Safe fallback: if no auth/host, returns { accepted: false }.
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    const host = userId ? await getApprovedHost(userId) : null;
    if (!host) {
      return Response.json({ accepted: false });
    }
    const agreement = await getHostAgreement(host.id);
    const accepted = await hasAcceptedHostAgreement(host.id);
    return Response.json({
      accepted: accepted && (agreement?.accepted ?? false),
      acceptedAt: agreement?.acceptedAt?.toISOString() ?? undefined,
      version: agreement?.version ?? undefined,
    });
  } catch (e) {
    console.error("GET /api/bnhub/host-agreement:", e);
    return Response.json({ accepted: false });
  }
}

/**
 * POST /api/bnhub/host-agreement — Accept the host agreement.
 * Body: { hostId: string }
 * Requires: authenticated user must be the approved host for that hostId.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const hostId = typeof body.hostId === "string" ? body.hostId : null;
    if (!hostId) {
      return Response.json({ error: "hostId required" }, { status: 400 });
    }

    const host = await getApprovedHost(userId);
    if (!host || host.id !== hostId) {
      return Response.json({ error: "Not authorized to accept for this host" }, { status: 403 });
    }

    await acceptHostAgreement(hostId);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/bnhub/host-agreement:", e);
    return Response.json({ error: "Failed to accept agreement" }, { status: 500 });
  }
}
