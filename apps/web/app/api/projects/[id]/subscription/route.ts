import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDemoProjectById } from "@/lib/data/demo-projects";
import { getTrialEndDate } from "@/lib/projects-pricing";

export const dynamic = "force-dynamic";

function daysRemaining(trialEnd: Date): number {
  const now = new Date();
  const end = new Date(trialEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!project) {
      const demo = getDemoProjectById(id);
      if (demo) {
        const trialEnd = getTrialEndDate();
        return NextResponse.json({
          projectId: id,
          isTrial: true,
          trialEnd: trialEnd.toISOString(),
          daysRemaining: daysRemaining(trialEnd),
          plan: "free",
          isActive: true,
          isExpired: false,
        });
      }
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const sub = project.subscription;
    const trialEnd = sub?.trialEnd ?? getTrialEndDate(project.createdAt);
    const endDate = sub ? new Date(sub.trialEnd) : new Date(trialEnd);
    const days = daysRemaining(endDate);
    const isExpired = sub?.isTrial && days === 0;

    return NextResponse.json({
      projectId: project.id,
      isTrial: sub?.isTrial ?? true,
      trialEnd: endDate.toISOString(),
      daysRemaining: days,
      plan: sub?.plan ?? "free",
      isActive: sub?.isActive ?? true,
      isExpired,
    });
  } catch (e) {
    console.error("GET /api/projects/[id]/subscription:", e);
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const plan = body.plan as string; // free | basic | premium | pay_per_lead

    const project = await prisma.project.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!["free", "basic", "premium", "pay_per_lead"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (project.subscription) {
      await prisma.projectSubscription.update({
        where: { projectId: id },
        data: { plan, isTrial: plan === "free" },
      });
    } else {
      await prisma.projectSubscription.create({
        data: {
          projectId: id,
          isTrial: plan === "free",
          trialEnd: new Date(),
          plan,
          isActive: true,
        },
      });
    }

    const sub = await prisma.project.findUnique({
      where: { id },
      include: { subscription: true },
    });
    return NextResponse.json(sub?.subscription ?? { plan });
  } catch (e) {
    console.error("PATCH /api/projects/[id]/subscription:", e);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
