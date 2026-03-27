import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectsUserId } from "@/lib/projects-user";
import { predictUnitPrice } from "@/lib/ai/unit-pricing";
import { logError } from "@/lib/logger";
import { investmentFeaturesOr403 } from "@/lib/compliance/investment-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blocked = await investmentFeaturesOr403();
    if (blocked) return blocked;

    const userId = await getProjectsUserId();
    const items = await prisma.investorPortfolio.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    logError("GET /api/investments/portfolio", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const blocked = await investmentFeaturesOr403();
    if (blocked) return blocked;

    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const { projectId, unitId, purchasePrice } = body ?? {};
    if (!projectId || !purchasePrice) return NextResponse.json({ error: "projectId and purchasePrice required" }, { status: 400 });
    const portfolio = await prisma.investorPortfolio.create({
      data: { userId, projectId: String(projectId), unitId: unitId ? String(unitId) : null, purchasePrice: Number(purchasePrice), currentValue: Number(purchasePrice) },
    });
    return NextResponse.json(portfolio);
  } catch (e) {
    logError("POST /api/investments/portfolio", e);
    return NextResponse.json({ error: "Failed to add investment" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const blocked = await investmentFeaturesOr403();
    if (blocked) return blocked;

    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const { id } = body ?? {};
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const existing = await prisma.investorPortfolio.findFirst({ where: { id: String(id), userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = await prisma.project.findUnique({ where: { id: existing.projectId }, select: { id: true, city: true, status: true, startingPrice: true, featured: true, deliveryDate: true } });
    const unit = existing.unitId ? await prisma.projectUnit.findUnique({ where: { id: existing.unitId }, select: { id: true, type: true, price: true, size: true, status: true } }) : null;
    const pred = predictUnitPrice(project ?? { id: existing.projectId, city: "Montreal", status: "upcoming", startingPrice: existing.purchasePrice, featured: false }, unit ?? { id: existing.unitId ?? "fallback", type: "1bed", price: existing.purchasePrice, size: 60, status: "available" });
    const updated = await prisma.investorPortfolio.update({ where: { id: existing.id }, data: { currentValue: pred.predictedDeliveryValue } });
    return NextResponse.json(updated);
  } catch (e) {
    logError("PATCH /api/investments/portfolio", e);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}
