import { NextRequest, NextResponse } from "next/server";
import { ContentAutomationAssetType } from "@prisma/client";
import { verifyContentAutomationWebhook } from "@/lib/content-automation/webhook-verify";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyContentAutomationWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    videoUrl?: string;
    providerJobId?: string;
  };

  if (!body.jobId || !body.videoUrl) {
    return NextResponse.json({ error: "jobId and videoUrl required" }, { status: 400 });
  }

  await prisma.contentAsset.create({
    data: {
      contentJobId: body.jobId,
      assetType: ContentAutomationAssetType.VIDEO,
      mediaUrl: body.videoUrl,
      metadataJson: { provider: "pictory", jobId: body.providerJobId ?? null },
    },
  });

  return NextResponse.json({ ok: true });
}
