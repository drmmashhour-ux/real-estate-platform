import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { approveExperiment } from "@/modules/evolution/experiment.service";

export const dynamic = "force-dynamic";

/** Human gate — experiments stay draft until approved. */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Admin approval required" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const row = await approveExperiment(id, userId);
    return NextResponse.json({ experiment: row });
  } catch {
    return NextResponse.json({ error: "Unable to approve experiment" }, { status: 500 });
  }
}
