import { NextResponse } from "next/server";
import { analyzeOaciqFormText, getOaciqExampleLibrary } from "@/lib/forms/oaciq-examples";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    examples: getOaciqExampleLibrary(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawText = typeof body?.rawText === "string" ? body.rawText : "";

  if (!rawText.trim()) {
    return NextResponse.json({ error: "Provide rawText to analyze." }, { status: 400 });
  }

  return NextResponse.json({
    analysis: analyzeOaciqFormText(rawText),
  });
}
