import { NextResponse } from "next/server";
import { runListingAutopilot } from "@/lib/autopilot/run-listing-autopilot";
import { requireListingOwnerOrAdmin } from "@/lib/autopilot/listing-guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await ctx.params;
  const gate = await requireListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    const result = await runListingAutopilot({
      listingId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Run failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
