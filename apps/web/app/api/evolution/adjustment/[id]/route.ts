import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { approvePolicyAdjustment, rejectPolicyAdjustment } from "@/modules/evolution/policy-adjustment";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Admin approval required" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action === "reject" ? "reject" : "approve";

  try {
    const row =
      action === "reject" ? await rejectPolicyAdjustment(id, userId) : await approvePolicyAdjustment(id, userId);
    return NextResponse.json({ adjustment: row });
  } catch {
    return NextResponse.json({ error: "Unable to update adjustment" }, { status: 500 });
  }
}
