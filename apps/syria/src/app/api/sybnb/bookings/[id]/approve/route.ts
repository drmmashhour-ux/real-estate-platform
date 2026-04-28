import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { hostApproveSybnbV1Request } from "@/lib/sybnb/sybnb-v1-request-service";
import { logSybnbEvent, sybnbAuditRoleHostAction } from "@/lib/sybnb/sybnb-audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteParams): Promise<Response> {
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

  const r = await hostApproveSybnbV1Request({ userId: user.id, userRole: user.role, bookingId: id });
  if (!r.ok) {
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

  return sybnbJson({ booking: r.booking });
}
