import { NextResponse } from "next/server";
import { selectStrategy } from "@/src/modules/ai-selection-engine/application/selectStrategy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }
  const withExplanation = url.searchParams.get("explain") === "1";
  const item = await selectStrategy(propertyId, withExplanation);
  return NextResponse.json({ item });
}
