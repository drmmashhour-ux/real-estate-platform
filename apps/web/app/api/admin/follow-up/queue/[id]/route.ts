import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  requeueClientFollowUp,
  sendClientFollowUpNow,
  skipClientFollowUp,
} from "@/lib/follow-up/client-follow-up-engine";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  return user?.role === "ADMIN" ? user : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";
  const { id } = await params;

  try {
    if (action === "send_now") {
      const item = await sendClientFollowUpNow(id);
      return NextResponse.json({ ok: true, item });
    }

    if (action === "skip") {
      const item = await skipClientFollowUp(id);
      return NextResponse.json({ ok: true, item });
    }

    if (action === "requeue") {
      const item = await requeueClientFollowUp(id);
      return NextResponse.json({ ok: true, item });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 }
    );
  }
}
