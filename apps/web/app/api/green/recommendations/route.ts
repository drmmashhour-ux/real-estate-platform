import { NextRequest, NextResponse } from "next/server";
import { evaluateQuebecEsg } from "@/modules/green-ai/quebec-esg.engine";
import { generateQuebecEsgRecommendations } from "@/modules/green-ai/quebec-esg-recommendation.service";
import { GreenEngineInput } from "@/modules/green/green.types";

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as GreenEngineInput;
    
    const evaluation = evaluateQuebecEsg(input);
    const recommendations = generateQuebecEsgRecommendations(input, evaluation);

    return NextResponse.json({
      score: evaluation.score,
      label: evaluation.label,
      breakdown: evaluation.breakdown,
      recommendations: recommendations.recommendations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
