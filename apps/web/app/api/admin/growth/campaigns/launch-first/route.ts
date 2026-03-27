import { NextResponse } from "next/server";
import {
  buildGrowthCampaignShareUrls,
  launchFirstGrowthCampaign,
} from "@/lib/growth-acquisition";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST — ensure there is at least one ACTIVE growth campaign (activate draft or create default).
 * Returns suggested tracking URLs for /evaluate (first-touch cookie).
 */
export async function POST() {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const { campaign, action } = await launchFirstGrowthCampaign();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lecipm.com";
    const shareUrls = buildGrowthCampaignShareUrls({ baseUrl, campaign });

    return NextResponse.json({
      ok: true,
      action,
      campaign,
      shareUrls,
      message:
        action === "already_active"
          ? "A campaign is already active."
          : action === "activated_draft"
            ? "Draft campaign is now ACTIVE."
            : "Created and launched your first acquisition campaign.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to launch campaign" }, { status: 500 });
  }
}
