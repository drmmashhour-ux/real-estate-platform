import { NextRequest } from "next/server";
import { updateDisputeStatus } from "@/lib/bnhub/disputes";
import { prisma } from "@/lib/db";

/** GET /api/bnhub/disputes/:id — Get one dispute with booking, listing, messages, evidence. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            status: true,
            guestId: true,
            guest: { select: { id: true, name: true, email: true } },
          },
        },
        listing: { select: { id: true, title: true, ownerId: true } },
        evidence: true,
        resolutions: true,
      },
    });
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });
    return Response.json(dispute);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body?.status;
    const allowedStatuses = ["OPEN", "SUBMITTED", "UNDER_REVIEW", "WAITING_FOR_HOST_RESPONSE", "EVIDENCE_REVIEW", "RESOLVED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_FULL_REFUND", "RESOLVED_RELOCATION", "REJECTED", "ESCALATED", "CLOSED"];
    if (!status || !allowedStatuses.includes(status)) {
      return Response.json({ error: "status must be one of: " + allowedStatuses.join(", ") }, { status: 400 });
    }
    const dispute = await updateDisputeStatus(
      id,
      status,
      body.resolutionNotes,
      body.resolvedBy
    );
    return Response.json(dispute);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
