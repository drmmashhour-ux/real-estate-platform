import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { logSybnbEvent, sybnbAuditRoleHostAction } from "@/lib/sybnb/sybnb-audit";
import {
  SYBNB_SIM_ESCROW_PENDING,
  SYBNB_SIM_ESCROW_SECURED,
  SYBNB_SIM_ESCROW_RELEASED,
} from "@/lib/sybnb/sybnb-simulated-escrow";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

type RouteParams = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simulated escrow only — host marks payment received (no PSP, no funds movement).
 *
 * Rules: caller must be **host**; booking must be past host approval (`approved` or subsequent manual-phase statuses);
 * sets `sybnbSimulatedEscrowStatus` → `simulated_secured`. Audit: **PAYMENT_MARKED_RECEIVED**, **ESCROW_SECURED**.
 */
async function handleMarkPaidPOST(_req: Request, context: RouteParams): Promise<Response> {
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

  const b = await prisma.sybnbBooking.findUnique({ where: { id } });
  if (!b) {
    return sybnbFail("not_found", 404);
  }
  if (b.hostId !== user.id) {
    return sybnbFail("forbidden", 403);
  }

  const allowedStatus =
    b.status === "approved" ||
    b.status === "confirmed" ||
    b.status === "payment_pending" ||
    b.status === "needs_review";
  if (!allowedStatus) {
    return sybnbFail("bad_state", 409);
  }

  const cur = b.sybnbSimulatedEscrowStatus?.trim();
  if (cur === SYBNB_SIM_ESCROW_SECURED || cur === SYBNB_SIM_ESCROW_RELEASED) {
    return sybnbFail("bad_state", 409);
  }
  if (cur != null && cur !== SYBNB_SIM_ESCROW_PENDING) {
    return sybnbFail("bad_state", 409);
  }

  const updated = await prisma.sybnbBooking.update({
    where: { id: b.id },
    data: { sybnbSimulatedEscrowStatus: SYBNB_SIM_ESCROW_SECURED, version: { increment: 1 } },
  });

  const actor = sybnbAuditRoleHostAction(user.role);

  await logSybnbEvent({
    action: "PAYMENT_MARKED_RECEIVED",
    bookingId: b.id,
    userId: user.id,
    actorRole: actor,
    metadata: { simulated: true },
  });
  await logSybnbEvent({
    action: "ESCROW_SECURED",
    bookingId: b.id,
    userId: user.id,
    actorRole: actor,
    metadata: { simulated: true },
  });

  return sybnbJson({ booking: updated });
}

export async function POST(req: Request, context: RouteParams): Promise<Response> {
  return sybnbApiCatch(() => handleMarkPaidPOST(req, context));
}
