import { NextRequest } from "next/server";
import { BnhubChannelConnectionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const userId = await getGuestId();
  if (!(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { connectionId } = await params;
  const body = (await request.json()) as { status?: "ACTIVE" | "PAUSED" | "ERROR" };

  const status =
    body.status === "PAUSED"
      ? BnhubChannelConnectionStatus.PAUSED
      : body.status === "ERROR"
        ? BnhubChannelConnectionStatus.ERROR
        : BnhubChannelConnectionStatus.ACTIVE;

  await prisma.bnhubChannelConnection.update({
    where: { id: connectionId },
    data: { status },
  });
  return Response.json({ ok: true });
}
