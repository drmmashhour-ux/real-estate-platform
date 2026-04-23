import { NextRequest } from "next/server";
import { BnhubChannelConnectionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { syncConnection } from "@/src/modules/bnhub-channel-manager";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { connectionId } = await params;

  const conn = await prisma.bnhubChannelConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!conn) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as {
    status?: "ACTIVE" | "PAUSED" | "ERROR";
    icalImportUrl?: string | null;
    syncFrequencyMinutes?: number;
  };

  const data: {
    status?: BnhubChannelConnectionStatus;
    icalImportUrl?: string | null;
    syncFrequencyMinutes?: number;
    lastError?: null;
  } = {};

  if (body.status === "PAUSED") data.status = BnhubChannelConnectionStatus.PAUSED;
  if (body.status === "ACTIVE") {
    data.status = BnhubChannelConnectionStatus.ACTIVE;
    data.lastError = null;
  }
  if (body.status === "ERROR") data.status = BnhubChannelConnectionStatus.ERROR;
  if (body.icalImportUrl !== undefined) data.icalImportUrl = body.icalImportUrl?.trim() || null;
  if (body.syncFrequencyMinutes != null) {
    data.syncFrequencyMinutes = Math.min(1440, Math.max(5, body.syncFrequencyMinutes));
  }

  const updated = await prisma.bnhubChannelConnection.update({
    where: { id: connectionId },
    data,
    include: { mappings: true },
  });
  return Response.json({ connection: updated });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { connectionId } = await params;

  const conn = await prisma.bnhubChannelConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!conn) return Response.json({ error: "Not found" }, { status: 404 });

  const action = request.nextUrl.searchParams.get("action");
  if (action !== "sync") {
    return Response.json({ error: "Use ?action=sync" }, { status: 400 });
  }

  const result = await syncConnection(connectionId);
  const fresh = await prisma.bnhubChannelConnection.findUnique({
    where: { id: connectionId },
    include: { mappings: true, syncLogs: { take: 5, orderBy: { createdAt: "desc" } } },
  });
  return Response.json({ result, connection: fresh });
}
