import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { captureGrowthLead } from "@/modules/growth/funnel-tracking.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "growth_form";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    const row = await captureGrowthLead({
      email,
      source: source.slice(0, 160),
      metaJson:
        typeof body.meta === "object" && body.meta !== null ?
          (body.meta as Record<string, unknown>)
        : undefined,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    logError("[growth.capture-lead]", { error: e });
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
