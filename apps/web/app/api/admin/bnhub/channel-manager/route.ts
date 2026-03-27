import { NextRequest } from "next/server";
import type { BnhubChannelConnectionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const allowed: BnhubChannelConnectionStatus[] = ["ACTIVE", "PAUSED", "ERROR"];
  const status =
    statusParam && allowed.includes(statusParam as BnhubChannelConnectionStatus)
      ? (statusParam as BnhubChannelConnectionStatus)
      : undefined;

  const connections = await prisma.bnhubChannelConnection.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { id: true, email: true, name: true } },
      mappings: { include: { listing: { select: { id: true, title: true } } } },
      syncLogs: { take: 10, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return Response.json({ connections });
}
