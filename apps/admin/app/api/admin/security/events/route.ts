import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET ?q=&limit= — searchable security-ish platform events. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    120,
    Math.max(10, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "40", 10) || 40)
  );

  const where: Prisma.PlatformEventWhereInput = q
    ? {
        OR: [
          { eventType: { contains: q, mode: "insensitive" } },
          { sourceModule: { contains: q, mode: "insensitive" } },
          { entityId: { contains: q, mode: "insensitive" } },
        ],
      }
    : {
        OR: [
          { sourceModule: "security" },
          { eventType: { startsWith: "auth_" } },
          { eventType: { startsWith: "security_" } },
          { eventType: { contains: "webhook", mode: "insensitive" } },
          { eventType: { contains: "payment", mode: "insensitive" } },
        ],
      };

  const events = await prisma.platformEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      sourceModule: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      payload: true,
      processingStatus: true,
    },
  });

  return Response.json({ events });
}
