import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const leads = await prisma.outreachLead.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[outreach][list] Error:", error);
    return NextResponse.json(
      { error: "Failed to list outreach leads" },
      { status: 500 }
    );
  }
}
