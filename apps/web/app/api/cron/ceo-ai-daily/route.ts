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

/** Daily AI CEO cadence — proposals only; execution stays gated. */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runCeo("daily");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logError("[api.cron.ceo-ai-daily]", { error: e });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
