import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const events = await prisma.aiFeedbackEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      subsystem: true,
      entityType: true,
      entityId: true,
      userId: true,
      rating: true,
      accepted: true,
      promptOrQuery: true,
      outputSummary: true,
      actionTaken: true,
      createdAt: true,
    },
  });
  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
