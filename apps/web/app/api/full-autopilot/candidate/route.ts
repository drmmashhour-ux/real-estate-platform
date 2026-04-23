import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { AutopilotCandidateContext } from "@/modules/autopilot-execution/autopilot-execution.types";
import { submitAutopilotCandidate } from "@/modules/autopilot-execution/autopilot-execution.service";

export const dynamic = "force-dynamic";

/** Admin-only harness to inject a normalized candidate (integrations call `submitAutopilotCandidate` directly). */
export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await request.json()) as AutopilotCandidateContext;
    const result = await submitAutopilotCandidate(body);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[full-autopilot/candidate]", e);
    return NextResponse.json({ error: "candidate_failed" }, { status: 500 });
  }
}
