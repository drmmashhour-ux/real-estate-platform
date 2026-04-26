import { NextRequest, NextResponse } from "next/server";
import {
  ContentAutomationJobStatus,
  ContentSocialPostStatus,
  ContentSocialPublishMode,
} from "@prisma/client";
import { verifyContentAutomationWebhook } from "@/lib/content-automation/webhook-verify";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Metricool callback — scheduled post id + optional publish timestamps */
export async function POST(req: NextRequest) {
  if (!verifyContentAutomationWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    contentJobId?: string;
    socialPostId?: string;
    externalId?: string;
    scheduledAt?: string;
    status?: string;
  };

  if (body.socialPostId) {
    await prisma.contentSocialPost.update({
      where: { id: body.socialPostId },
      data: {
        externalPostId: body.externalId,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        status:
          body.status === "published"
            ? ContentSocialPostStatus.PUBLISHED
            : ContentSocialPostStatus.SCHEDULED,
        publishMode: ContentSocialPublishMode.SCHEDULED,
      },
    });
  }

  if (body.contentJobId) {
    await prisma.contentJob.update({
      where: { id: body.contentJobId },
      data: {
        status:
          body.status === "published"
            ? ContentAutomationJobStatus.PUBLISHED
            : ContentAutomationJobStatus.SCHEDULED,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
