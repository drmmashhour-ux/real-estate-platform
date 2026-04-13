import { Prisma, ShareAuditActorType, ShareAuditEventType, ShareSessionStatus, ShareSessionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { expireSessionIfNeeded } from "@/lib/share-sessions/session-lifecycle";

export type UpdateLocationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function updateShareLocation(params: {
  sessionId: string;
  guestUserId: string;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
}): Promise<UpdateLocationResult> {
  const { sessionId: id, guestUserId, lat, lng, accuracyMeters } = params;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { ok: false, status: 400, error: "Invalid coordinates" };
  }
  if (accuracyMeters != null && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0)) {
    return { ok: false, status: 400, error: "Invalid accuracyMeters" };
  }

  const row = await prisma.shareSession.findUnique({
    where: { id },
    select: {
      id: true,
      guestUserId: true,
      status: true,
      expiresAt: true,
      shareType: true,
    },
  });
  if (!row || row.guestUserId !== guestUserId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const status = await expireSessionIfNeeded(row);
  if (status !== ShareSessionStatus.ACTIVE) {
    return { ok: false, status: 410, error: "Sharing is not active" };
  }
  if (row.shareType !== ShareSessionType.LIVE_LOCATION) {
    return { ok: false, status: 400, error: "Live location is off for this session" };
  }

  await prisma.$transaction([
    prisma.shareSession.update({
      where: { id },
      data: {
        latestLat: new Prisma.Decimal(lat.toFixed(6)),
        latestLng: new Prisma.Decimal(lng.toFixed(6)),
        latestAccuracyMeters: accuracyMeters != null && Number.isFinite(accuracyMeters) ? accuracyMeters : null,
        lastLocationAt: new Date(),
      },
    }),
    prisma.shareAuditEvent.create({
      data: {
        shareSessionId: id,
        actorType: ShareAuditActorType.GUEST,
        eventType: ShareAuditEventType.LOCATION_UPDATED,
        metadataJson: { accuracyMeters: accuracyMeters ?? null },
      },
    }),
  ]);

  return { ok: true };
}
