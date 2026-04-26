import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { matchBuyerToProjects } from "@/lib/ai/matching";
import { getProjectsUserId } from "@/lib/projects-user";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId ? String(body.userId) : await getProjectsUserId();
    const profileInput = body?.profile ?? null;

    const profile = profileInput
      ? profileInput
      : await prisma.buyerProfile.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        city: true,
        status: true,
        startingPrice: true,
        featured: true,
        deliveryDate: true,
        name: true,
      },
    });
    const units = await prisma.projectUnit.findMany({
      select: { id: true, projectId: true, type: true, price: true, size: true, status: true },
    });

    const ranked = matchBuyerToProjects(
      profile ?? { userId, cityPreference: "Montreal", maxBudget: 700000, investmentGoal: "appreciation" },
      (projects.length ? projects : DEMO_PROJECTS).map((p) => ({
        id: p.id,
        city: p.city,
        status: p.status,
        startingPrice: p.startingPrice,
        featured: p.featured,
        deliveryDate: p.deliveryDate,
        name: p.name,
      })),
      units.reduce<Record<string, any[]>>((acc, unit) => {
        acc[unit.projectId] = acc[unit.projectId] ?? [];
        acc[unit.projectId].push(unit);
        return acc;
      }, {})
    );
    return NextResponse.json(ranked);
  } catch (e) {
    logError("POST /api/ai/match-projects", e);
    const ranked = matchBuyerToProjects(
      { userId: "demo-user", cityPreference: "Montreal", maxBudget: 700000, investmentGoal: "appreciation" },
      DEMO_PROJECTS.map((p) => ({
        id: p.id,
        city: p.city,
        status: p.status,
        startingPrice: p.startingPrice,
        featured: p.featured,
        deliveryDate: p.deliveryDate,
        name: p.name,
      })),
      DEMO_PROJECTS.reduce<Record<string, any[]>>((acc, p) => {
        acc[p.id] = p.units ?? [];
        return acc;
      }, {})
    );
    return NextResponse.json(ranked);
  }
}
