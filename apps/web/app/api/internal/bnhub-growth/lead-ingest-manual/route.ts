import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import {
  ingestLeadFromConnector,
  type NormalizedLeadInput,
} from "@/src/modules/bnhub-growth-engine/services/leadEngineService";
import { leadResponseJob } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Aligns lead.hostUserId with listing/campaign ownership — prevents cross-host attribution when automation secret leaks. */
async function assertLeadOwnershipConsistency(input: NormalizedLeadInput): Promise<Response | null> {
  if (input.listingId) {
    const list = await prisma.shortTermListing.findUnique({
      where: { id: input.listingId },
      select: { ownerId: true },
    });
    if (!list) return Response.json({ error: "listing not found" }, { status: 404 });
    if (input.hostUserId != null && input.hostUserId !== list.ownerId) {
      return Response.json({ error: "hostUserId must match listing owner" }, { status: 403 });
    }
    if (input.hostUserId == null) input.hostUserId = list.ownerId;
  }
  if (input.campaignId) {
    const c = await prisma.bnhubGrowthCampaign.findUnique({
      where: { id: input.campaignId },
      select: { hostUserId: true, listingId: true },
    });
    if (!c) return Response.json({ error: "campaign not found" }, { status: 404 });
    if (input.hostUserId != null && input.hostUserId !== c.hostUserId) {
      return Response.json({ error: "hostUserId must match campaign host" }, { status: 403 });
    }
    if (input.hostUserId == null) input.hostUserId = c.hostUserId;
    if (input.listingId && c.listingId !== input.listingId) {
      return Response.json({ error: "campaign does not belong to listing" }, { status: 400 });
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as NormalizedLeadInput;
  const err = await assertLeadOwnershipConsistency(body);
  if (err) return err;
  const lead = await ingestLeadFromConnector(body, { actorId: null });
  await leadResponseJob(lead.id);
  return Response.json({ ok: true, leadId: lead.id });
}
