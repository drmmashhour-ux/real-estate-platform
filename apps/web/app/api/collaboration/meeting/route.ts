import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { createTeamsMeeting, createZoomMeeting } from "@/modules/collaboration/collaboration-meeting.service";
import type { CollaborationEntityType } from "@/modules/collaboration/collaboration.types";

export const dynamic = "force-dynamic";

const ENTITIES = new Set<CollaborationEntityType>(["listing", "lead", "broker", "deal_room"]);

async function assertBrokerOrAdmin(viewerId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  return u?.role === PlatformRole.BROKER || u?.role === PlatformRole.ADMIN;
}

export async function POST(req: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await assertBrokerOrAdmin(viewerId))) {
    return NextResponse.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const type = body?.type === "teams" ? "teams" : body?.type === "zoom" ? "zoom" : null;
  const entityType = typeof body?.entityType === "string" ? body.entityType : "";
  const entityId = typeof body?.entityId === "string" ? body.entityId : "";
  const mode = body?.mode === "schedule" ? "schedule" : "now";

  if (!type || !ENTITIES.has(entityType as CollaborationEntityType) || !entityId.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session =
    type === "zoom"
      ? createZoomMeeting({
          entityType: entityType as CollaborationEntityType,
          entityId: entityId.trim(),
          createdBy: viewerId,
          mode: mode === "schedule" ? "schedule" : "now",
        })
      : createTeamsMeeting({
          entityType: entityType as CollaborationEntityType,
          entityId: entityId.trim(),
          createdBy: viewerId,
          mode: mode === "schedule" ? "schedule" : "now",
        });

  return NextResponse.json({ session });
}
