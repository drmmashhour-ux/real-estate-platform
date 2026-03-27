import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { computeBrokerIsVerified } from "@/modules/mortgage/services/broker-verification";

export const dynamic = "force-dynamic";

/** POST — approve mortgage broker (AMF compliance review). */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await context.params;
  const broker = await prisma.mortgageBroker.findUnique({
    where: { id },
    select: { id: true, userId: true, profileCompletedAt: true, identityStatus: true },
  });
  if (!broker?.userId) return NextResponse.json({ error: "Broker not found" }, { status: 404 });
  if (!broker.profileCompletedAt) {
    return NextResponse.json({ error: "Profile not submitted" }, { status: 400 });
  }

  await prisma.mortgageBroker.update({
    where: { id: broker.id },
    data: {
      verificationStatus: "verified",
      isVerified: computeBrokerIsVerified({
        verificationStatus: "verified",
        identityStatus: broker.identityStatus,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
