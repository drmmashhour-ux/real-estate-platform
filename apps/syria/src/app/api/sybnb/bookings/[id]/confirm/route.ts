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
import { hostConfirmSybnbV1Booking } from "@/lib/sybnb/sybnb-v1-request-service";
import { broadcastSybnbBookingUpdated } from "@/lib/realtime/sybnb-broadcast";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  clientVersion: z.coerce.number().int().min(1),
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

  let clientVersion = 1;
  try {
    const raw = (await req.json()) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return sybnbFail(firstZodIssueMessage(parsed.error), 400);
    }
    clientVersion = parsed.data.clientVersion;
  } catch {
    return sybnbFail("Invalid JSON body", 400);
  }

  const r = await hostConfirmSybnbV1Booking({
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

  broadcastSybnbBookingUpdated(r.booking.id, { status: r.booking.status });

  return sybnbJson({ booking: r.booking });
}
