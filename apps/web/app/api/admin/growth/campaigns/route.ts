import { NextRequest } from "next/server";
import { getGrowthCampaigns, createGrowthCampaign } from "@/lib/growth-acquisition";
import type { GrowthCampaignStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID_STATUSES: GrowthCampaignStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];

async function requireAdmin(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const viewerId = await getGuestId();
  if (!viewerId) return { ok: false, status: 401, error: "Sign in required" };
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") return { ok: false, status: 403, error: "Admin only" };
  return { ok: true };
}

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId") ?? undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam && VALID_STATUSES.includes(statusParam as GrowthCampaignStatus)
      ? (statusParam as GrowthCampaignStatus)
      : undefined;
    const campaigns = await getGrowthCampaigns({ marketId, status });
    return Response.json(campaigns);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

    const body = await request.json();
    const { name, campaignType, marketId, startAt, endAt, config, status } = body;
    if (!name || !campaignType || !startAt || !endAt) {
      return Response.json(
        { error: "name, campaignType, startAt, endAt required" },
        { status: 400 }
      );
    }
    const st =
      typeof status === "string" && VALID_STATUSES.includes(status as GrowthCampaignStatus)
        ? (status as GrowthCampaignStatus)
        : undefined;
    const campaign = await createGrowthCampaign({
      name,
      campaignType,
      marketId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      config,
      status: st,
    });
    return Response.json(campaign);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
