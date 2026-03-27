import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const deals = await prisma.mortgageDeal.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      expert: { select: { id: true, name: true, email: true } },
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          pipelineStatus: true,
          mortgageInquiry: true,
        },
      },
    },
  });

  return NextResponse.json({ deals });
}
