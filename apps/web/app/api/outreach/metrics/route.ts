import { NextRequest, NextResponse } from "next/server";
import { getOutreachMetrics } from "@/modules/growth/outreach-metrics.service";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metrics = await getOutreachMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[outreach][metrics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outreach metrics" },
      { status: 500 }
    );
  }
}
