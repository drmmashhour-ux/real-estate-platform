import { NextRequest, NextResponse } from "next/server";
import { simulateQuebecEsgUpgrade } from "@/modules/green-ai/quebec-esg-simulator.service";
import { GreenEngineInput } from "@/modules/green/green.types";

export async function POST(req: NextRequest) {
  try {
    const { baseInput, recommendationKeys } = (await req.json()) as {
      baseInput: GreenEngineInput;
      recommendationKeys: string[];
    };

    const simulation = simulateQuebecEsgUpgrade(baseInput, recommendationKeys);

    return NextResponse.json({
      currentScore: simulation.currentScore,
      projectedScore: simulation.projectedScore,
      delta: simulation.delta,
      label: simulation.newLabel
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
