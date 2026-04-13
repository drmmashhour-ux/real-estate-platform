import { NextRequest, NextResponse } from "next/server";
import { ContentSocialPlatform, ContentSocialPostStatus } from "@prisma/client";
import { verifyContentAutomationWebhook } from "@/lib/content-automation/webhook-verify";
import { recordPerformanceSnapshot } from "@/lib/content-automation/sync-performance";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** TikTok / Instagram / Meta delivery or insights webhooks */
export async function POST(req: NextRequest) {
  if (!verifyContentAutomationWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    socialPostId?: string;
    platform?: keyof typeof ContentSocialPlatform;
    metrics?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      clicks?: number;
      conversions?: number;
    };
    status?: "published" | "failed";
  };

  if (body.socialPostId && body.status === "published") {
    await prisma.contentSocialPost.update({
      where: { id: body.socialPostId },
      data: {
        status: ContentSocialPostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  if (body.socialPostId && body.platform && body.metrics) {
    const pl =
      body.platform === "TIKTOK"
        ? ContentSocialPlatform.TIKTOK
        : body.platform === "FACEBOOK"
          ? ContentSocialPlatform.FACEBOOK
          : ContentSocialPlatform.INSTAGRAM;
    await recordPerformanceSnapshot({
      socialPostId: body.socialPostId,
      platform: pl,
      metrics: body.metrics,
    });
  }

  return NextResponse.json({ ok: true });
}
