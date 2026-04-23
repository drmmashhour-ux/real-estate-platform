import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const where =
    user.role === PlatformRole.ADMIN
      ? { status: { in: ["open", "assigned"] } }
      : { ownerType: "solo_broker", ownerId: user.id, status: { in: ["open", "assigned"] } };

  const items = await prisma.complianceManualReviewQueue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, items });
}
