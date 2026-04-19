import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  addCollaborationNote,
  listCollaborationNotes,
} from "@/modules/collaboration/collaboration-notes.service";
import type { CollaborationEntityType } from "@/modules/collaboration/collaboration.types";

export const dynamic = "force-dynamic";

const ENTITIES = new Set<CollaborationEntityType>(["listing", "lead", "broker"]);

async function assertBrokerOrAdmin(viewerId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  return u?.role === PlatformRole.BROKER || u?.role === PlatformRole.ADMIN;
}

export async function GET(req: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await assertBrokerOrAdmin(viewerId))) {
    return NextResponse.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType") ?? "";
  const entityId = searchParams.get("entityId") ?? "";
  if (!ENTITIES.has(entityType as CollaborationEntityType) || !entityId.trim()) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const notes = listCollaborationNotes(entityType as CollaborationEntityType, entityId.trim());
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await assertBrokerOrAdmin(viewerId))) {
    return NextResponse.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const entityType = typeof body?.entityType === "string" ? body.entityType : "";
  const entityId = typeof body?.entityId === "string" ? body.entityId : "";
  const text = typeof body?.body === "string" ? body.body : "";

  if (!ENTITIES.has(entityType as CollaborationEntityType) || !entityId.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const res = addCollaborationNote({
    entityType: entityType as CollaborationEntityType,
    entityId: entityId.trim(),
    body: text,
    createdBy: viewerId,
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  return NextResponse.json({ note: res.note });
}
