import { ShareAuditActorType, ShareAuditEventType, ShareSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { expireSessionIfNeeded } from "@/lib/share-sessions/session-lifecycle";

export type StopSessionResult =
  | { ok: true; status: ShareSessionStatus }
  | { ok: false; status: number; error: string };

export async function stopShareSession(params: {
  sessionId: string;
  guestUserId: string;
}): Promise<StopSessionResult> {
  const { sessionId: id, guestUserId } = params;

  const row = await prisma.shareSession.findUnique({
    where: { id },
    select: {
      id: true,
      guestUserId: true,
      status: true,
      expiresAt: true,
    },
  });
  if (!row || row.guestUserId !== guestUserId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const status = await expireSessionIfNeeded(row);
  if (status === ShareSessionStatus.EXPIRED || status === ShareSessionStatus.STOPPED) {
    return { ok: true, status };
  }

  await prisma.$transaction([
    prisma.shareSession.update({
      where: { id },
      data: {
        status: ShareSessionStatus.STOPPED,
        stoppedAt: new Date(),
        latestLat: null,
        latestLng: null,
        latestAccuracyMeters: null,
        lastLocationAt: null,
      },
    }),
    prisma.shareAuditEvent.create({
      data: {
        shareSessionId: id,
        actorType: ShareAuditActorType.GUEST,
        eventType: ShareAuditEventType.STOPPED,
        metadataJson: {},
      },
    }),
  ]);

  return { ok: true, status: ShareSessionStatus.STOPPED };
}
