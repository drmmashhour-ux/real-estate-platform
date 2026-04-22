import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { runCeo } from "@/modules/ceo-ai/ceo-ai.service";

export const dynamic = "force-dynamic";

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/** Weekly strategy sweep — broader review run type. */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runCeo("weekly");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logError("[api.cron.ceo-ai-weekly]", { error: e });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
