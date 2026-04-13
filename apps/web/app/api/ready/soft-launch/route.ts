import { NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/runtime-env";
import { getSoftLaunchStatus } from "@/lib/ops/soft-launch-status";

export const dynamic = "force-dynamic";

/**
 * Soft-launch gate: infra + inventory heuristics for BNHUB guest bookings.
 * See `getSoftLaunchStatus` in `lib/ops/soft-launch-status.ts` (also used by CLI).
 */
export async function GET() {
  const body = await getSoftLaunchStatus();
  const status = body.ready ? 200 : 503;
  return NextResponse.json(
    {
      ...body,
      env: getPublicEnv(),
    },
    { status }
  );
}
