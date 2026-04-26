import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { generateAndStoreCapitalPlan } from "@/modules/capital-allocator/capital-plan-persist.service";

export const dynamic = "force-dynamic";

async function ensureScopeAccess(scopeId: string): Promise<boolean> {
  const userId = await getGuestId();
  if (!userId) return false;
  if (userId === scopeId) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scopeType = searchParams.get("scopeType");
  const scopeId = searchParams.get("scopeId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";

  const where: { scopeType?: string; scopeId?: string } = {};

  if (!isAdmin) {
    if (scopeId && scopeId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.scopeId = userId;
    if (scopeType) where.scopeType = scopeType;
  } else {
    if (scopeType) where.scopeType = scopeType;
    if (scopeId) where.scopeId = scopeId;
  }

  const rows = await prisma.capitalAllocationPlan.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ success: true, rows });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      scopeType?: string;
      scopeId?: string;
      totalBudget?: number;
      reservePct?: number;
      periodLabel?: string;
      notes?: string;
    };

    const { scopeType, scopeId, totalBudget, reservePct, periodLabel, notes } = body;

    if (!scopeType || !scopeId || typeof totalBudget !== "number") {
      return NextResponse.json({ error: "scopeType, scopeId, and totalBudget are required" }, { status: 400 });
    }

    const ok = await ensureScopeAccess(scopeId);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plan = await generateAndStoreCapitalPlan({
      scopeType,
      scopeId,
      totalBudget,
      reservePct,
      periodLabel,
      notes,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate capital plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
