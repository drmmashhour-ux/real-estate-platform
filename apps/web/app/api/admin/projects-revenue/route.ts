import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payments = await prisma.projectLeadPayment.groupBy({
      by: ["projectId"],
      _sum: { amount: true },
      _count: { id: true },
    });

    const projectIds = payments.map((p) => p.projectId);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
    });
    const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));

    const list = payments.map((p) => ({
      projectId: p.projectId,
      projectName: nameById[p.projectId] ?? p.projectId,
      totalRevenue: p._sum.amount ?? 0,
      leadsPaid: p._count.id,
    }));

    const totalRevenue = list.reduce((s, p) => s + p.totalRevenue, 0);

    return NextResponse.json({
      byProject: list,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch (e) {
    console.error("GET /api/admin/projects-revenue:", e);
    return NextResponse.json({ error: "Failed to load revenue" }, { status: 500 });
  }
}
