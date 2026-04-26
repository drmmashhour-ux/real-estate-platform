import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { rankProjectsForInvestment } from "@/lib/ai/investment-ranking";
import { analyzeProjectInvestment } from "@/lib/ai/openai-investment";
import { logError } from "@/lib/logger";
import { investmentFeaturesOr403 } from "@/lib/compliance/investment-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blocked = await investmentFeaturesOr403();
    if (blocked) return blocked;

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
      take: 100,
    });
    const units = await prisma.projectUnit.findMany({
      select: { id: true, projectId: true, type: true, price: true, size: true, status: true },
      take: 400,
    });
    const ranked = rankProjectsForInvestment(
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
    const aiRanked = await Promise.all(
      ranked.map(async (item) => {
        const project = (projects.find((p) => p.id === item.projectId) ?? DEMO_PROJECTS.find((p) => p.id === item.projectId)) as any;
        const unit = units.find((u) => u.projectId === item.projectId);
        const ai = await analyzeProjectInvestment(project, unit ? [unit] : []);
        if (!ai) return item;
        const score = Number(ai.investmentScore ?? item.score);
        return {
          ...item,
          score,
          reason: String(ai.shortExplanation ?? item.reason),
          appreciationPotential: Number(ai.expectedAppreciation ? Math.round(Number(ai.expectedAppreciation) * 100) : item.appreciationPotential),
          rentalYield: Number(ai.rentalYieldEstimate ?? item.rentalYield),
          riskScore: ai.riskLevel === "low" ? Math.max(0, item.riskScore - 10) : ai.riskLevel === "high" ? Math.min(100, item.riskScore + 10) : item.riskScore,
        };
      })
    );
    return NextResponse.json(aiRanked);
  } catch (e) {
    logError("GET /api/ai/investment-ranking", e);
    const ranked = rankProjectsForInvestment(
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
