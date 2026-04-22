import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { recordFunnelEvent, type FunnelCategory } from "@/modules/growth/funnel-tracking.service";

export const dynamic = "force-dynamic";

const ALLOWED: FunnelCategory[] = ["VISIT", "SIGNUP", "ACTIVATION", "CONVERSION"];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category.trim().toUpperCase() : "";
  if (!ALLOWED.includes(category as FunnelCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    await recordFunnelEvent({
      category: category as FunnelCategory,
      path: typeof body.path === "string" ? body.path : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      email: typeof body.email === "string" ? body.email : null,
      metaJson:
        typeof body.meta === "object" && body.meta !== null ?
          (body.meta as Record<string, unknown>)
        : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("[growth.funnel-event]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
