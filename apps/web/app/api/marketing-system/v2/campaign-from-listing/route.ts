import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { launchCampaignFromListing } from "@/modules/marketing-system-v2/campaign-launch.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!engineFlags.blogSystemV1) {
    return NextResponse.json({ error: "Campaign launch is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const result = await launchCampaignFromListing(parsed.data.listingId, auth.userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
