import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { generateAutonomousSuggestions } from "@/lib/suggestions/generator";
import { ProactiveSuggestionError } from "@/lib/suggestions/safety";

export const dynamic = "force-dynamic";

/**
 * POST /api/suggestions/generate — derive patterns from behavior signals and persist new proactive rows.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as { ownerType?: string };
    const ownerType =
      typeof body.ownerType === "string" && body.ownerType.length > 0 ? body.ownerType : "solo_broker";

    const items = await generateAutonomousSuggestions(ownerType, auth.id);
    return NextResponse.json({ success: true, items });
  } catch (e) {
    if (e instanceof ProactiveSuggestionError) {
      return NextResponse.json({ success: false, error: e.code }, { status: 422 });
    }
    const msg = e instanceof Error ? e.message : "Generate failed";
    const status =
      msg === "GUARANTEED_OUTCOME_FORBIDDEN" || msg === "PROACTIVE_WORKFLOW_REQUIRES_APPROVAL" ? 422 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
