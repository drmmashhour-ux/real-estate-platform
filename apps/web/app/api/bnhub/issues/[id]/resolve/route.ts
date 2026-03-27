import { NextRequest } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * POST /api/bnhub/issues/[id]/resolve — Admin: approve refund or reject claim.
 * Body: { action: "approve_refund" | "reject" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await getUserRole();
    if (role !== "admin") {
      return Response.json({ error: "Admin required" }, { status: 403 });
    }

    const { id: issueId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === "approve_refund" || body.action === "reject" ? body.action : null;
    if (!action) {
      return Response.json({ error: "action must be approve_refund or reject" }, { status: 400 });
    }

    const issue = await prisma.bookingIssue.findUnique({
      where: { id: issueId },
      include: { booking: true },
    });
    if (!issue) {
      return Response.json({ error: "Issue not found" }, { status: 404 });
    }
    if (issue.status !== "open" && issue.status !== "reviewing") {
      return Response.json({ error: "Issue already resolved" }, { status: 400 });
    }

    const status = action === "approve_refund" ? "approved" : "rejected";
    const adminId = await getGuestId();

    await prisma.$transaction([
      prisma.bookingIssue.update({
        where: { id: issueId },
        data: {
          status,
          resolvedAt: new Date(),
          resolvedBy: adminId ?? "admin",
        },
      }),
      ...(action === "approve_refund"
        ? [
            prisma.booking.update({
              where: { id: issue.bookingId },
              data: { refunded: true, refundedAt: new Date() },
            }),
          ]
        : []),
    ]);

    return Response.json({ ok: true, status });
  } catch (e) {
    console.error("POST /api/bnhub/issues/[id]/resolve:", e);
    return Response.json({ error: "Failed to resolve issue" }, { status: 500 });
  }
}
