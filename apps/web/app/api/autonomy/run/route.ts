import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { runAutonomyCycle } from "@/modules/autonomy/autonomy-orchestrator.service";
import { canInvokeAutonomyCycle } from "@/modules/autonomy/autonomy-access.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { scopeType?: string; scopeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scopeType = typeof body.scopeType === "string" ? body.scopeType.trim() : "";
  const scopeId = typeof body.scopeId === "string" ? body.scopeId.trim() : "";

  if (!scopeType || !scopeId || !["portfolio", "listing"].includes(scopeType)) {
    return NextResponse.json(
      { error: "scopeType must be portfolio | listing and scopeId is required" },
      { status: 400 }
    );
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await canInvokeAutonomyCycle(userId, scopeType, scopeId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAutonomyCycle(scopeType, scopeId);
    return NextResponse.json({ success: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Autonomy cycle failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
