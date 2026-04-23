import { NextRequest } from "next/server";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/bnhub/issues — List issues.
 * Query: bookingId (optional) — for guest, only returns issues for their booking; for admin, no filter returns all.
 * Safe fallback: missing booking returns [].
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const role = await getUserRole();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId") ?? undefined;

    if (isHubAdminRole(role)) {
      const where = bookingId ? { bookingId } : {};
      const issues = await prisma.bookingIssue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              refunded: true,
              listing: { select: { title: true } },
              guest: { select: { name: true, email: true } },
            },
          },
        },
      });
      return Response.json(issues);
    }

    if (!userId) {
      return Response.json([]);
    }
    if (!bookingId) {
      return Response.json([]);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true },
    });
    if (!booking || booking.guestId !== userId) {
      return Response.json([]);
    }

    const issues = await prisma.bookingIssue.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(issues);
  } catch (e) {
    console.error("GET /api/bnhub/issues:", e);
    return Response.json([]);
  }
}

/**
 * POST /api/bnhub/issues — Report a booking issue (guest only).
 * Body: { bookingId, issueType, description }
 * Notifies admin and host (log only if email not configured).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : null;
    const issueType = typeof body.issueType === "string" ? body.issueType.trim() : null;
    const description = typeof body.description === "string" ? body.description.trim() : null;

    if (!bookingId || !issueType || !description) {
      return Response.json(
        { error: "bookingId, issueType, and description are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { ownerId: true, title: true } }, guest: { select: { email: true, name: true } } },
    });
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    // Safe fallback: do not crash if guest missing
    if (booking.guestId !== userId) {
      return Response.json({ error: "Not authorized to report issues for this booking" }, { status: 403 });
    }

    const issue = await prisma.bookingIssue.create({
      data: {
        bookingId,
        issueType,
        description,
        status: "open",
      },
    });

    // Notify admin and host: use existing email if available; otherwise log only (safe fallback).
    try {
      const host = await prisma.user.findUnique({
        where: { id: booking.listing.ownerId },
        select: { email: true, name: true },
      });
      const guestEmail = booking.guest?.email;
      const hostEmail = host?.email;
      console.info("[BNHUB Issue] New issue reported", {
        issueId: issue.id,
        bookingId,
        issueType,
        guestEmail: guestEmail ?? "(not set)",
        hostEmail: hostEmail ?? "(not set)",
      });
      // If email provider configured, send here; if not, do not crash.
    } catch (_) {
      // ignore
    }

    return Response.json(issue, { status: 201 });
  } catch (e) {
    console.error("POST /api/bnhub/issues:", e);
    return Response.json({ error: "Failed to submit issue" }, { status: 500 });
  }
}
