import { NextRequest, NextResponse } from "next/server";
import { assertAdminResponse } from "@/lib/admin/assert-admin";
import { applyGrowthLeadAutomation } from "@/lib/growth/lead-automation";

export const dynamic = "force-dynamic";

/** POST ?dryRun=1 — schedule follow-ups + sync tiers from scores. */
export async function POST(req: NextRequest) {
  const err = await assertAdminResponse();
  if (err) return err;
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const result = await applyGrowthLeadAutomation({ dryRun });
  return NextResponse.json({ ok: true, dryRun, ...result });
}
