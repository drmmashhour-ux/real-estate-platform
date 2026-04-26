import { NextResponse } from "next/server";
import { z } from "zod";

import { getGuestId } from "@/lib/auth/session";
import { optimizeCampaign } from "@/lib/campaign-optimizer/optimize-campaign-hardening";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST — BNHub growth campaign optimizer (Order 39.1): hardened recommendations + optional apply (pause only).
 * Body: `{ campaignId, dryRun? }` — `dryRun` defaults to true.
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { campaignId, dryRun } = parsed.data;
  const result = await optimizeCampaign(userId, campaignId, dryRun);
  if (result.reason === "Campaign not found.") {
    return NextResponse.json(result, { status: 404 });
  }
  if (result.reason.startsWith("Forbidden:")) {
    return NextResponse.json(result, { status: 403 });
  }
  return NextResponse.json(result);
}
