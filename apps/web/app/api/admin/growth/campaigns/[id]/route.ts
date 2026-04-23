import { NextRequest, NextResponse } from "next/server";
import type { GrowthCampaignStatus } from "@prisma/client";
import { setGrowthCampaignStatus } from "@/lib/growth-acquisition";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID: GrowthCampaignStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status =
    typeof body.status === "string" ? (body.status.toUpperCase() as GrowthCampaignStatus) : null;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: "body.status must be one of: DRAFT, ACTIVE, PAUSED, ENDED" },
      { status: 400 }
    );
  }

  try {
    const campaign = await setGrowthCampaignStatus(id, status);
    return NextResponse.json({ ok: true, campaign });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Campaign not found or update failed" }, { status: 404 });
  }
}
