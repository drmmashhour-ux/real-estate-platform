import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const sp = request.nextUrl.searchParams;
    const entityType = sp.get("entityType")?.trim();
    const take = Math.min(200, Math.max(1, Number(sp.get("limit")) || 40));

    const rows = await prisma.legalAuditLog.findMany({
      where: entityType ? { entityType } : {},
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({
      items: rows,
      nextCursor: null,
    });
  } catch (e) {
    console.error("GET /api/legal/audit", e);
    return NextResponse.json({ items: [], nextCursor: null }, { status: 200 });
  }
}
