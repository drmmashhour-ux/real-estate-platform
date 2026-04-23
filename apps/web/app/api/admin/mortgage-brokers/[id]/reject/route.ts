import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST — reject mortgage broker profile. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await context.params;
  let notes = "";
  try {
    const body = (await request.json().catch(() => ({}))) as { notes?: string };
    if (typeof body.notes === "string") notes = body.notes.slice(0, 2000);
  } catch {
    /* optional body */
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!broker?.userId) return NextResponse.json({ error: "Broker not found" }, { status: 404 });

  await prisma.mortgageBroker.update({
    where: { id: broker.id },
    data: {
      isVerified: false,
      verificationStatus: "rejected",
    },
  });

  if (notes) {
    await prisma.activityLog
      .create({
        data: {
          userId: broker.userId,
          action: "mortgage_broker_rejected",
          metadata: { notes },
        },
      })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
