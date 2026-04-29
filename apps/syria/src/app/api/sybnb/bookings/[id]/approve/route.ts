import {
  sybnbBookingConflict,
  sybnbBookingSoftLock,
  sybnbFail,
  sybnbJson,
  firstZodIssueMessage,
} from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { hostApproveSybnbV1Request } from "@/lib/sybnb/sybnb-v1-request-service";
import { broadcastSybnbBookingUpdated } from "@/lib/realtime/sybnb-broadcast";
import { SYBNB_SYNC_LEGACY_CLIENT_ID } from "@/lib/sybnb/sybnb-sync-constants";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  clientRequestId: z.string().trim().min(8).max(128).optional(),
  clientVersion: z.coerce.number().int().min(1),
  clientId: z.string().trim().min(8).max(128).optional(),
});

export async function POST(req: Request, context: RouteParams): Promise<Response> {
  const { id: rawId } = await context.params;
  const idParsed = sybnbIdParam.safeParse(rawId);
  if (!idParsed.success) {
    return sybnbFail(firstZodIssueMessage(idParsed.error), 400);
  }
  const id = idParsed.data;

  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }
  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  let clientRequestId = "";
  let clientVersion = 1;
  let deviceId = SYBNB_SYNC_LEGACY_CLIENT_ID;
  try {
    const raw = (await req.json()) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return sybnbFail(firstZodIssueMessage(parsed.error), 400);
    }
    clientRequestId = parsed.data.clientRequestId?.trim() ?? "";
    clientVersion = parsed.data.clientVersion;
    deviceId = parsed.data.clientId?.trim() || SYBNB_SYNC_LEGACY_CLIENT_ID;
  } catch {
    return sybnbFail("Invalid JSON body", 400);
  }

  if (clientRequestId) {
    const hit = await prisma.sybnbSyncIdempotency.findUnique({
      where: {
        clientRequestId_clientId: {
          clientRequestId,
          clientId: deviceId,
        },
      },
      select: { userId: true, kind: true, bookingId: true },
    });
    if (hit && hit.kind === "approve" && hit.bookingId === id && hit.userId === user.id) {
      const booking = await prisma.sybnbBooking.findUnique({ where: { id } });
      if (booking) {
        broadcastSybnbBookingUpdated(booking.id, { status: booking.status });
        return sybnbJson({ booking, duplicate: true });
      }
    }
  }

  const r = await hostApproveSybnbV1Request({
    userId: user.id,
    userRole: user.role,
    bookingId: id,
    clientVersion,
  });
  if (!r.ok) {
    if (r.code === "conflict" && r.currentVersion != null && r.currentStatus != null) {
      return sybnbBookingConflict(r.currentVersion, r.currentStatus);
    }
    if (r.code === "soft_lock" && r.currentVersion != null && r.currentStatus != null) {
      return sybnbBookingSoftLock(r.currentVersion, r.currentStatus);
    }
    const status = r.code === "forbidden" ? 403 : r.code === "not_found" ? 404 : 409;
    return sybnbFail(r.code, status);
  }

  await logSybnbEvent({
    action: "BOOKING_APPROVED",
    bookingId: r.booking.id,
    userId: user.id,
    actorRole: sybnbAuditRoleHostAction(user.role),
    metadata: { status: "approved" },
  });

  if (clientRequestId) {
    await prisma.sybnbSyncIdempotency
      .create({
        data: {
          clientRequestId,
          clientId: deviceId,
          userId: user.id,
          kind: "approve",
          bookingId: r.booking.id,
        },
      })
      .catch(() => {});
  }

  broadcastSybnbBookingUpdated(r.booking.id, { status: r.booking.status });

  return sybnbJson({ booking: r.booking });
}
