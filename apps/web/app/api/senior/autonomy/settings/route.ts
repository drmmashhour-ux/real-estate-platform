import { NextResponse } from "next/server";
import type { SeniorAutonomyMode } from "@prisma/client";
import {
  getOrCreateAutonomySettings,
  setAutonomyMode,
  setAutonomyPaused,
} from "@/modules/senior-living/autonomy/senior-autonomous.service";
import { canPricing, seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const s = await getOrCreateAutonomySettings();
  return NextResponse.json({
    mode: s.mode,
    paused: s.paused,
    updatedAt: s.updatedAt.toISOString(),
    canEditMode: canPricing(auth.ctx),
  });
}

export async function PATCH(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  let body: { mode?: SeniorAutonomyMode; paused?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.mode != null) {
    if (!canPricing(auth.ctx)) {
      return NextResponse.json({ error: "Only admins can change autonomy mode" }, { status: 403 });
    }
    await setAutonomyMode(body.mode);
  }
  if (typeof body.paused === "boolean") {
    await setAutonomyPaused(body.paused);
  }

  const s = await getOrCreateAutonomySettings();
  return NextResponse.json({
    ok: true,
    mode: s.mode,
    paused: s.paused,
    updatedAt: s.updatedAt.toISOString(),
  });
}
