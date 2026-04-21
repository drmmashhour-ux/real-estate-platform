import { NextResponse } from "next/server";
import { CONTRACTOR_WORK_DISCLAIMER, POSITIONING_GREEN_EXECUTION } from "@/modules/contractors/contractor.model";
import { getContractorProfile } from "@/modules/contractors/contractor.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await getContractorProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    profile,
    disclaimer: CONTRACTOR_WORK_DISCLAIMER,
    positioning: POSITIONING_GREEN_EXECUTION,
  });
}
