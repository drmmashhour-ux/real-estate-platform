import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { userId?: string; role?: string; priority?: number; active?: boolean };
  if (!b.userId) return Response.json({ error: "userId required" }, { status: 400 });

  try {
    const row = await prisma.salesAgent.create({
      data: {
        userId: b.userId,
        role: typeof b.role === "string" ? b.role : "agent",
        priority: typeof b.priority === "number" ? b.priority : 0,
        active: b.active !== false,
      },
    });
    await prisma.salesPerformance.upsert({
      where: { agentId: row.id },
      create: { agentId: row.id },
      update: {},
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
