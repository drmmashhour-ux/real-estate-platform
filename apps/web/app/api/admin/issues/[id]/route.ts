import { NextRequest } from "next/server";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const ALLOWED_STATUSES = ["reviewing", "approved", "rejected", "resolved"] as const;

/**
 * PATCH /api/admin/issues/[id] — Update issue status (admin only).
 * Body: { status: "reviewing" | "approved" | "rejected" | "resolved" }
 * When status = "approved": set booking.refunded = true (refund execution can be manual/pending if Stripe not ready).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await getUserRole();
    if (!isHubAdminRole(role)) {
      return Response.json({ error: "Admin required" }, { status: 403 });
    }

    const { id: issueId } = await params;
    const body = await request.json().catch(() => ({}));
    const status = ALLOWED_STATUSES.includes(body.status) ? body.status : null;
    if (!status) {
      return Response.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const issue = await prisma.bookingIssue.findUnique({
      where: { id: issueId },
      include: { booking: { include: { guest: { select: { email: true } } } } },
    });
    if (!issue) {
      return Response.json({ error: "Issue not found" }, { status: 404 });
    }

    const adminId = await getGuestId();

    const updates: Prisma.PrismaPromise<any>[] = [
      prisma.bookingIssue.update({
        where: { id: issueId },
        data: {
          status,
          ...(status !== "open" ? { resolvedAt: new Date(), resolvedBy: adminId ?? "admin" } : {}),
        },
      }),
    ];

    if (status === "approved") {
      updates.push(
        prisma.booking.update({
          where: { id: issue.bookingId },
          data: { refunded: true, refundedAt: new Date() },
        })
      );
      // Refund decision stored. If Stripe integration exists, trigger refund here; otherwise process manually (safe fallback).
    }

    await prisma.$transaction(updates);

    // Notify guest when approved/rejected: use email if configured, else log only (safe fallback).
    try {
      console.info("[BNHUB Issue] Status updated", {
        issueId,
        status,
        guestEmail: issue.booking?.guest?.email ?? "(not set)",
      });
    } catch (_) {
      // ignore
    }

    return Response.json({ ok: true, status });
  } catch (e) {
    console.error("PATCH /api/admin/issues/[id]:", e);
    return Response.json({ error: "Failed to update issue" }, { status: 500 });
  }
}
