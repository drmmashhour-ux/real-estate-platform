import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { agentId, status } = await req.json();
    if (!agentId || !status) {
      return NextResponse.json({ error: "agentId and status are required" }, { status: 400 });
    }

    // @ts-ignore
    const updated = await prisma.aiAgent.update({
      where: { id: agentId },
      data: { status: status as "ACTIVE" | "PAUSED" },
    });

    return NextResponse.json({ ok: true, agent: updated });
  } catch (error) {
    console.error("[agents:api] update status failed", error);
    return NextResponse.json({ error: "Failed to update agent status" }, { status: 500 });
  }
}
