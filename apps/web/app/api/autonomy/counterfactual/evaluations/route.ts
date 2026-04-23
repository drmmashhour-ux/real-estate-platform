import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const scopeType = searchParams.get("scopeType");
  const scopeId = searchParams.get("scopeId");

  const where: { scopeType?: string; scopeId?: string } = {};
  if (scopeType) where.scopeType = scopeType;
  if (scopeId) where.scopeId = scopeId;

  const rows = await prisma.counterfactualEvaluation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, rows });
}
