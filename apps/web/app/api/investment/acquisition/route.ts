import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runAcquisitionAnalysis } from "@/modules/investment/acquisition.service";
import { prisma } from "@repo/db";
import type { UnderwritingInput } from "@/modules/investment/underwriting.types";
import { isLecipmPhaseEnabled, lecipmRolloutDisabledMeta, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

type Body = Partial<UnderwritingInput> & {
  title?: string;
  location?: string;
};

function parseBody(raw: unknown): Body | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const purchasePrice = Number(o.purchasePrice);
  const adr = Number(o.adr);
  const occupancyRate = Number(o.occupancyRate);
  const monthlyCost = Number(o.monthlyCost);
  if (![purchasePrice, adr, occupancyRate, monthlyCost].every((n) => Number.isFinite(n))) {
    return null;
  }
  const out: Body = {
    purchasePrice,
    adr,
    occupancyRate,
    monthlyCost,
  };
  if (o.financingRate !== undefined && o.financingRate !== null) {
    const fr = Number(o.financingRate);
    if (Number.isFinite(fr)) out.financingRate = fr;
  }
  if (o.downPayment !== undefined && o.downPayment !== null) {
    const dp = Number(o.downPayment);
    if (Number.isFinite(dp)) out.downPayment = dp;
  }
  if (typeof o.title === "string") out.title = o.title;
  if (typeof o.location === "string") out.location = o.location;
  return out;
}

/** POST — persist a deterministic acquisition / scenario run (signed-in user). */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json(
      {
        error: "Missing or invalid fields",
        required: ["purchasePrice", "adr", "occupancyRate", "monthlyCost"],
      },
      { status: 400 }
    );
  }

  const sessionUserId = await getGuestId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLecipmPhaseEnabled(1)) {
    logRolloutGate(1, "/api/investment/acquisition POST");
    return NextResponse.json({
      success: false,
      rollout: lecipmRolloutDisabledMeta(1),
      analysis: null,
    });
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const analysis = runAcquisitionAnalysis(body);

  const saved = await prisma.acquisitionAnalysis.create({
    data: {
      userId,
      title: typeof body.title === "string" ? body.title.slice(0, 200) : undefined,
      location: typeof body.location === "string" ? body.location.slice(0, 400) : undefined,
      purchasePrice: analysis.assumptions.purchasePrice,
      estimatedADR: analysis.assumptions.adr,
      estimatedOccupancy: analysis.assumptions.occupancyRate,
      operatingCostMonthly: analysis.assumptions.monthlyCost,
      financingRate: analysis.assumptions.financingRate ?? undefined,
      downPayment: analysis.assumptions.downPayment ?? undefined,
      resultsJson: {
        assumptions: analysis.assumptions,
        result: analysis.result,
        score: analysis.score,
        recommendation: analysis.recommendation,
        confidenceScore: analysis.confidenceScore,
        disclaimer: analysis.disclaimer,
      } as Prisma.InputJsonValue,
      scenariosJson: analysis.scenarios as unknown as Prisma.InputJsonValue,
      recommendation: analysis.recommendation,
      score: analysis.score,
      confidenceScore: analysis.confidenceScore,
    },
  });

  return NextResponse.json({
    success: true,
    analysis,
    id: saved.id,
  });
}
