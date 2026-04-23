import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const [project, leads, payments] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: { subscription: true },
      }),
      prisma.lead.findMany({
        where: { projectId },
        select: { id: true, contactUnlockedAt: true },
      }),
      prisma.projectLeadPayment.findMany({
        where: { projectId },
        select: { amount: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const totalLeads = leads.length;
    const unlockedLeads = leads.filter((l) => l.contactUnlockedAt != null).length;
    const lockedLeads = totalLeads - unlockedLeads;
    const revenue = payments.reduce((s, p) => s + p.amount, 0);
    const conversionRate = totalLeads > 0 ? Math.round((unlockedLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      projectId,
      projectName: project.name,
      totalLeads,
      unlockedLeads,
      lockedLeads,
      revenue: Math.round(revenue * 100) / 100,
      conversionRate,
      plan: project.subscription?.plan ?? "free",
      isTrial: project.subscription?.isTrial ?? true,
      trialEnd: project.subscription?.trialEnd?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("GET /api/projects/[id]/stats:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
