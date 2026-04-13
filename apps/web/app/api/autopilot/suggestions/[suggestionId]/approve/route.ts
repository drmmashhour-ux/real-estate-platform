import { NextResponse } from "next/server";
import { approveListingOptimizationSuggestion } from "@/lib/autopilot/approve-suggestion";
import { requireSuggestionAccess } from "@/lib/autopilot/listing-guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ suggestionId: string }> }) {
  const { suggestionId } = await ctx.params;
  const gate = await requireSuggestionAccess(suggestionId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const res = await approveListingOptimizationSuggestion({
    suggestionId,
    performedByUserId: gate.userId,
  });
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
