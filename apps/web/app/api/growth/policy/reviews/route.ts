import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { listGrowthPolicyReviews } from "@/modules/growth/policy/growth-policy-review.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.growthPolicyV1 || !engineFlags.growthPolicyReviewV1) {
    return NextResponse.json({ error: "Growth policy reviews disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const fingerprint = url.searchParams.get("fingerprint")?.trim();
  const reviews = fingerprint ? listGrowthPolicyReviews(fingerprint) : [];
  return NextResponse.json({ reviews });
}
