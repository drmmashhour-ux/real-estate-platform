import { NextResponse } from "next/server";
import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { sybnbConfig } from "@/config/sybnb.config";
import { applySybnbCheckoutComplete } from "@/lib/sybnb/apply-sybnb-checkout";
import { createCheckoutSession, recordCheckoutAttempt } from "@/lib/sybnb/payments";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

const MANUAL_MESSAGE = "Payment handled manually";

/**
 * SYBNB-4: checkout — `SybnbBooking` (v1) uses feature-flagged payment abstraction; legacy `SyriaBooking` stay flow unchanged. SYBNB-7: uniform errors.
 */
export async function POST(_req: Request, context: RouteParams): Promise<Response> {
  const { id: rawId } = await context.params;
  const idParsed = sybnbIdParam.safeParse(rawId);
  if (!idParsed.success) {
    return sybnbFail(firstZodIssueMessage(idParsed.error), 400);
  }
  const bookingId = idParsed.data;

  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  try {
    const sybnbB = await prisma.sybnbBooking.findUnique({ where: { id: bookingId } });
    if (sybnbB) {
      const isGuest = sybnbB.guestId === user.id;
      const isAdmin = user.role === "ADMIN";
      if (!isGuest && !isAdmin) {
        return sybnbFail("forbidden", 403);
      }
      if (sybnbB.status !== "approved") {
        return sybnbFail("invalid_state", 409);
      }

      await recordCheckoutAttempt(sybnbB.id, user.id);

      if (!sybnbConfig.paymentsEnabled) {
        await prisma.sybnbBooking.update({
          where: { id: sybnbB.id },
          data: { paymentStatus: "manual_required" },
        });
        await createCheckoutSession({ bookingId: sybnbB.id, actorId: user.id });
        return sybnbJson({ message: MANUAL_MESSAGE });
      }

      const session = await createCheckoutSession({ bookingId: sybnbB.id, actorId: user.id });
      return sybnbJson({ session });
    }

    const booking = await prisma.syriaBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });
    if (!booking) {
      return sybnbFail("not_found", 404);
    }
    if (booking.property.category !== "stay") {
      return sybnbFail("not_stay", 400);
    }
    const isGuest = booking.guestId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isGuest && !isAdmin) {
      return sybnbFail("forbidden", 403);
    }

    const applied = await applySybnbCheckoutComplete(booking.id, { growthEventSource: "sybnb_api_checkout" });
    if (!applied.ok) {
      const e = applied.error;
      if (e.code === "payment_gated") {
        return NextResponse.json(
          {
            success: false,
            error: e.reason,
            reason: e.reason,
            detail: e.detail,
            riskCodes: e.riskCodes,
          },
          { status: e.status },
        );
      }
      return sybnbFail(e.code, e.status);
    }

    return sybnbJson({ completed: true });
  } catch (e) {
    console.error("[SYBNB] checkout failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}
