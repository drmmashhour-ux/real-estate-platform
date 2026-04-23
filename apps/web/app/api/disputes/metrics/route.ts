import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { getDisputeMetrics } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const result = await getDisputeMetrics({ role: actor.role });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result.metrics);
}
