import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildGuestRetentionInsights } from "@/modules/retention/insights.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/retention/admin/snapshot?userId= — ops preview of retention engine (admin only).
 */
export async function GET(request: NextRequest) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const insights = await buildGuestRetentionInsights(userId);
  if (!insights) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  return NextResponse.json({ success: true, userId, insights });
}
