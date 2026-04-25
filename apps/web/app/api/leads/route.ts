import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "BROKER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // List available leads for purchase
    const availableLeads = await prisma.lead.findMany({
      where: {
        leadStatus: "NEW",
        purchasedByBrokerId: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        score: true,
        conversionProbability: true,
        estimatedValue: true,
        createdAt: true,
        // We mask contact info for NEW leads
        name: true,
      },
    });

    return NextResponse.json(availableLeads);
  } catch (error) {
    console.error("[api/leads] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
