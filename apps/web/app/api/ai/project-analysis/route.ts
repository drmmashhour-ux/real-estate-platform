import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getDemoProjectById } from "@/lib/data/demo-projects";
import { analyzeProject } from "@/lib/ai/projects-analysis";
import { analyzeProjectInvestment } from "@/lib/ai/openai-investment";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const FALLBACK = {
  score: 50,
  recommendation: "Moderate" as const,
  rentalYield: 0.05,
  expectedAppreciation: 0.05,
  bestUnit: null as { id: string; type: string; price: number; size: number } | null,
};

async function getProjectWithUnits(projectId: string) {
  const fromDb = await prisma.project.findUnique({
    where: { id: projectId },
    include: { units: true },
  });
  if (fromDb) return fromDb;
  const demo = getDemoProjectById(projectId);
  return demo;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ ...FALLBACK, error: "projectId required" }, { status: 400 });
    }

    const project = await getProjectWithUnits(projectId);
    if (!project) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }

    const ai = await analyzeProjectInvestment(project, project.units ?? []);
    if (ai) {
      return NextResponse.json({
        score: Number(ai.investmentScore ?? ai.score ?? 50),
        recommendation: String(ai.shortExplanation ?? ai.recommendation ?? "Moderate"),
        rentalYield: Number(ai.rentalYieldEstimate ?? ai.rentalYield ?? 0.05),
        expectedAppreciation: Number(ai.expectedAppreciation ?? 0.05),
        bestUnit: (ai.bestUnitRecommendation as any) ?? null,
        riskLevel: ai.riskLevel ?? "medium",
      });
    }
    const result = analyzeProject(project, project.units ?? []);
    return NextResponse.json(result);
  } catch (e) {
    logError("GET /api/ai/project-analysis", e);
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body?.projectId;
    if (!projectId) {
      return NextResponse.json({ ...FALLBACK, error: "projectId required" }, { status: 400 });
    }

    const project = await getProjectWithUnits(projectId);
    if (!project) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }

    const ai = await analyzeProjectInvestment(project, project.units ?? []);
    if (ai) {
      return NextResponse.json({
        score: Number(ai.investmentScore ?? ai.score ?? 50),
        recommendation: String(ai.shortExplanation ?? ai.recommendation ?? "Moderate"),
        rentalYield: Number(ai.rentalYieldEstimate ?? ai.rentalYield ?? 0.05),
        expectedAppreciation: Number(ai.expectedAppreciation ?? 0.05),
        bestUnit: (ai.bestUnitRecommendation as any) ?? null,
        riskLevel: ai.riskLevel ?? "medium",
      });
    }
    const result = analyzeProject(project, project.units ?? []);
    return NextResponse.json(result);
  } catch (e) {
    logError("POST /api/ai/project-analysis", e);
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
