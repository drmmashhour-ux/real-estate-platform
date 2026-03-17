import { NextRequest } from "next/server";
import { createDispute, getAllDisputes } from "@/lib/bnhub/disputes";
import { recordPlatformEvent } from "@/lib/observability";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const disputes = await getAllDisputes();
    const filtered =
      status === "OPEN" || status === "UNDER_REVIEW" || status === "RESOLVED" || status === "CLOSED"
        ? disputes.filter((d) => d.status === status)
        : disputes;
    return Response.json(filtered);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingId = body?.bookingId;
    const claimant = body?.claimant;
    const claimantUserId = body?.claimantUserId;
    const description = body?.description;
    const evidenceUrls = Array.isArray(body?.evidenceUrls) ? body.evidenceUrls : [];
    if (!bookingId || !claimant || !claimantUserId || !description) {
      return Response.json(
        { error: "bookingId, claimant, claimantUserId, description required" },
        { status: 400 }
      );
    }
    if (claimant !== "GUEST" && claimant !== "HOST") {
      return Response.json({ error: "claimant must be GUEST or HOST" }, { status: 400 });
    }
    const dispute = await createDispute({
      bookingId,
      claimant,
      claimantUserId,
      description,
      evidenceUrls,
    });
    void recordPlatformEvent({
      eventType: "dispute_created",
      entityType: "DISPUTE",
      entityId: dispute.id,
      payload: { bookingId, claimant, status: dispute.status },
    });
    return Response.json(dispute);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
