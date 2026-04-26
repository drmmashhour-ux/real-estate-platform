import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { predictUnitPrice } from "@/lib/ai/unit-pricing";
import { predictUnitValueAI } from "@/lib/ai/openai-investment";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, unitId } = body ?? {};
    if (!projectId || !unitId) {
      return NextResponse.json({ error: "projectId and unitId are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: String(projectId) },
      select: {
        id: true,
        city: true,
        status: true,
        startingPrice: true,
        featured: true,
        deliveryDate: true,
      },
    });
    const unit = await prisma.projectUnit.findFirst({
      where: { id: String(unitId), projectId: String(projectId) },
      select: { id: true, type: true, price: true, size: true, status: true },
    });

    const ai = await predictUnitValueAI(project ?? { id: String(projectId) }, unit ?? { id: String(unitId) });
    if (ai) {
      return NextResponse.json({
        predictedCurrentValue: Number(ai.currentValue ?? ai.predictedCurrentValue ?? project?.startingPrice ?? 0),
        predictedDeliveryValue: Number(ai.deliveryValue ?? ai.predictedDeliveryValue ?? project?.startingPrice ?? 0),
        predicted1YearValue: Number(ai.oneYearValue ?? ai.predicted1YearValue ?? project?.startingPrice ?? 0),
        predictedGrowthPercent: Number(ai.growthPercent ?? ai.predictedGrowthPercent ?? 0),
        estimatedRentalYield: Number(ai.rentalYield ?? ai.estimatedRentalYield ?? 0.05),
        confidence: Number(ai.confidence ?? 70),
      });
    }

    if (!project || !unit) {
      const fallback = predictUnitPrice(
        { id: String(projectId), city: "Montreal", status: "under-construction", startingPrice: 450000, featured: false },
        { id: String(unitId), type: "1bed", price: 450000, size: 60, status: "available" }
      );
      return NextResponse.json(fallback);
    }

    return NextResponse.json(predictUnitPrice(project, unit));
  } catch (e) {
    logError("POST /api/ai/unit-pricing", e);
    return NextResponse.json(
      predictUnitPrice(
        { id: "fallback", city: "Montreal", status: "upcoming", startingPrice: 450000, featured: false },
        { id: "fallback-unit", type: "1bed", price: 450000, size: 60, status: "available" }
      ),
      { status: 200 }
    );
  }
}
