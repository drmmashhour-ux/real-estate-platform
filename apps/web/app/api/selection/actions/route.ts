import { NextResponse } from "next/server";
import { selectBestActions } from "@/src/modules/ai-selection-engine/application/selectBestActions";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const score = Number(url.searchParams.get("score") ?? "0");
  const trustScore = Number(url.searchParams.get("trustScore") ?? "0");
  const riskScore = Number(url.searchParams.get("riskScore") ?? "0");
  const confidence = Number(url.searchParams.get("confidence") ?? "40");
  const status = url.searchParams.get("status");
  const id = url.searchParams.get("id") ?? "entity";
  const type = url.searchParams.get("type") ?? "listing";

  const item = selectBestActions({ id, type, score, trustScore, riskScore, confidence, status });
  return NextResponse.json({ item });
}
