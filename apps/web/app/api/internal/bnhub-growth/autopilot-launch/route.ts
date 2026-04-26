import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { autoLaunchJob } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Supabase Edge / cron: supervised or full autopilot launch for one listing. */
export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as {
    listingId: string;
    hostUserId: string;
    autonomy?: "SUPERVISED_AUTOPILOT" | "FULL_AUTOPILOT";
  };
  if (!body.listingId || !body.hostUserId) {
    return Response.json({ error: "listingId and hostUserId required" }, { status: 400 });
  }
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: body.listingId },
    select: { ownerId: true },
  });
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.ownerId !== body.hostUserId) {
    return Response.json({ error: "hostUserId must match listing owner" }, { status: 403 });
  }
  const autonomy = body.autonomy ?? "SUPERVISED_AUTOPILOT";
  const camp = await autoLaunchJob(body.listingId, body.hostUserId, autonomy);
  return Response.json({ ok: true, campaign: camp });
}
