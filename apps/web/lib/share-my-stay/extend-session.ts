import { ShareAuditActorType, ShareAuditEventType, ShareSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { expireSessionIfNeeded } from "@/lib/share-sessions/session-lifecycle";
import { parseExtendBody } from "./validators";

export type ExtendSessionResult =
  | { ok: true; expiresAtIso: string }
  | { ok: false; status: number; error: string };

export async function extendShareSession(params: {
  sessionId: string;
  guestUserId: string;
  body: { addMinutes?: unknown; preset?: unknown };
}): Promise<ExtendSessionResult> {
  const { sessionId: id, guestUserId, body } = params;

  const parsed = parseExtendBody(body);
  if (!parsed) {
    return {
      ok: false,
      status: 400,
      error: "Use preset 1h, 8h, until_checkout, or addMinutes between 5 and 1440",
    };
  }

  const row = await prisma.shareSession.findUnique({
    where: { id },
    include: { booking: { select: { checkOut: true } } },
  });
  if (!row || row.guestUserId !== guestUserId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const status = await expireSessionIfNeeded({
    id: row.id,
    status: row.status,
    expiresAt: row.expiresAt,
  });
  if (status !== ShareSessionStatus.ACTIVE && status !== ShareSessionStatus.PAUSED) {
    return { ok: false, status: 400, error: "Session is not active" };
  }

  const cap = new Date(row.booking.checkOut.getTime() + 48 * 60 * 60 * 1000);
  const checkoutMs = row.booking.checkOut.getTime();
  let expiresAt: Date;

  if (parsed.kind === "until_checkout") {
    const target = Math.max(row.expiresAt.getTime(), checkoutMs);
    expiresAt = new Date(Math.min(cap.getTime(), target));
  } else {
    const nextExpires = new Date(row.expiresAt.getTime() + parsed.minutes * 60 * 1000);
    expiresAt = nextExpires.getTime() > cap.getTime() ? cap : nextExpires;
  }

  const presetRaw = typeof body.preset === "string" ? body.preset.trim().toLowerCase() : "";
  const untilCheckout = parsed.kind === "until_checkout";

  await prisma.$transaction([
    prisma.shareSession.update({
      where: { id },
      data: { expiresAt },
    }),
    prisma.shareAuditEvent.create({
      data: {
        shareSessionId: id,
        actorType: ShareAuditActorType.GUEST,
        eventType: ShareAuditEventType.EXTENDED,
        metadataJson: {
          preset: presetRaw || undefined,
          addMinutes: untilCheckout ? undefined : parsed.kind === "add_minutes" ? parsed.minutes : undefined,
          untilCheckout,
          newExpiresAt: expiresAt.toISOString(),
        },
      },
    }),
  ]);

  return { ok: true, expiresAtIso: expiresAt.toISOString() };
}
