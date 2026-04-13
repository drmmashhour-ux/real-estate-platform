import { NextRequest, NextResponse } from "next/server";
import { ContentAutomationAssetType, ContentAutomationJobStatus } from "@prisma/client";
import { verifyContentAutomationWebhook } from "@/lib/content-automation/webhook-verify";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Runway async completion — adapt payload to your Runway webhook contract.
 */
export async function POST(req: NextRequest) {
  if (!verifyContentAutomationWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    taskId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    status?: string;
  };

  if (!body.jobId || !body.videoUrl) {
    return NextResponse.json({ error: "jobId and videoUrl required" }, { status: 400 });
  }

  await prisma.contentAsset.create({
    data: {
      contentJobId: body.jobId,
      assetType: ContentAutomationAssetType.VIDEO,
      mediaUrl: body.videoUrl,
      metadataJson: { provider: "runway", taskId: body.taskId ?? null, thumbnailUrl: body.thumbnailUrl ?? null },
    },
  });

  await prisma.contentJob.update({
    where: { id: body.jobId },
    data: {
      status:
        body.status === "failed" ? ContentAutomationJobStatus.FAILED : ContentAutomationJobStatus.READY,
    },
  });

  return NextResponse.json({ ok: true });
}
