/**
 * POST /api/dictation-correction — Correct common dictation/speech-to-text errors.
 * Body: { text: string }
 * Returns: { corrected: string, changes: string[] }
 */

import { NextResponse } from "next/server";
import { correctDictation } from "@/lib/dictation-correction";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text : String(body.text ?? "");
    const { corrected, changes } = correctDictation(text);
    return NextResponse.json({ corrected, changes });
  } catch (e) {
    console.error("Dictation correction error:", e);
    return NextResponse.json(
      { error: "Correction failed" },
      { status: 500 }
    );
  }
}
