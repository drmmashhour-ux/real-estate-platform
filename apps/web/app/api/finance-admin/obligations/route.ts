import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessFinanceAdminHub } from "@/lib/admin/finance-hub-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!canAccessFinanceAdminHub(user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.regulatoryObligation.findMany({
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    obligations: rows,
    grouped: {
      OACIQ: rows.filter((r) => r.authority === "OACIQ"),
      FARCIQ: rows.filter((r) => r.authority === "FARCIQ"),
      AMF: rows.filter((r) => r.authority === "AMF"),
      REVENU_QUEBEC: rows.filter((r) => r.authority === "REVENU_QUEBEC"),
      CRA: rows.filter((r) => r.authority === "CRA"),
    },
  });
}
