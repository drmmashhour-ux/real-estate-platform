import { assertSybnb5PerMin, firstZodIssueMessage, sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { sybnbCreateBookingBody } from "@/lib/sybnb/sybnb-api-schemas";
import { createSybnbV1Request } from "@/lib/sybnb/sybnb-v1-request-service";
import { logSybnbEvent } from "@/lib/sybnb/sybnb-audit";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { s2GetClientIp } from "@/lib/security/s2-ip";
import { NextRequest } from "next/server";

/**
 * SYBNB-1: `SybnbBooking` request flow (no card payment). SYBNB-7: validation + rate limit + fallbacks.
 */
export async function GET(): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbJson({ bookings: [] });
  }
  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  try {
    const rows = await prisma.sybnbBooking.findMany({
      where: {
        OR: [{ guestId: user.id }, { hostId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        listing: { select: { id: true, titleAr: true, titleEn: true, city: true, images: true, currency: true } },
        guest: { select: { id: true, email: true, name: true } },
        host: { select: { id: true, email: true, name: true } },
      },
    });
    return sybnbJson({ bookings: rows });
  } catch (e) {
    console.error("[SYBNB] GET /api/sybnb/bookings failed", e instanceof Error ? e.message : e);
    return sybnbJson({ bookings: [] });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }
  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  const ip = s2GetClientIp(req);
  const tooMany = assertSybnb5PerMin("booking_create", ip);
  if (tooMany) {
    return tooMany;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return sybnbFail("Invalid JSON", 400);
  }

  const parsed = sybnbCreateBookingBody.safeParse(raw);
  if (!parsed.success) {
    return sybnbFail(firstZodIssueMessage(parsed.error), 400);
  }

  const { listingId, checkIn, checkOut, guests, clientRequestId } = parsed.data;

  if (clientRequestId) {
    const hit = await prisma.sybnbSyncIdempotency.findUnique({
      where: { clientRequestId },
      select: { userId: true, kind: true, bookingId: true },
    });
    if (hit && hit.kind === "booking_request" && hit.userId === user.id) {
      const existing = await prisma.sybnbBooking.findUnique({
        where: { id: hit.bookingId },
        include: {
          listing: { select: { id: true, titleAr: true, titleEn: true, city: true, images: true, currency: true } },
          guest: { select: { id: true, email: true, name: true } },
          host: { select: { id: true, email: true, name: true } },
        },
      });
      if (existing) {
        return sybnbJson({ booking: existing, duplicate: true }, 200);
      }
    }
  }

  const result = await createSybnbV1Request({
    guestId: user.id,
    listingId,
    checkIn,
    checkOut,
    guests,
  });

  if (!result.ok) {
    if (result.code === "restricted") {
      return sybnbFail("This account is temporarily restricted", 403);
    }
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "not_found"
          ? 404
          : result.code === "blocked"
            ? 403
            : 400;
    const codeToMsg: Record<string, string> = {
      unauthorized: "unauthorized",
      not_found: "not_found",
      not_stay: "not_stay",
      bad_dates: "bad_dates",
      own_listing: "own_listing",
      blocked: "blocked",
      restricted: "restricted",
      validation: "validation",
    };
    return sybnbFail(codeToMsg[result.code] ?? result.code, status);
  }

  await logSybnbEvent({
    action: "BOOKING_REQUEST_CREATED",
    bookingId: result.booking.id,
    userId: user.id,
    actorRole: "guest",
    metadata: {
      listingId,
      checkIn,
      checkOut,
      guests,
      total: result.booking.totalAmount,
    },
  });

  if (clientRequestId) {
    await prisma.sybnbSyncIdempotency
      .create({
        data: {
          clientRequestId,
          clientId: deviceId,
          userId: user.id,
          kind: "booking_request",
          bookingId: result.booking.id,
        },
      })
      .catch(() => {});
  }

  broadcastSybnbBookingUpdated(result.booking.id, { status: result.booking.status });

  return sybnbJson({ booking: result.booking }, 201);
}
