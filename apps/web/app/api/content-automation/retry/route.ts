import { NextRequest, NextResponse } from "next/server";
import { ContentAutomationJobStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { retryContentJob } from "@/lib/content-automation/retry-job";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { jobId?: string; skipVideo?: boolean };
  if (!body.jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  await prisma.contentJob.update({
    where: { id: body.jobId },
    data: { status: ContentAutomationJobStatus.QUEUED, errorMessage: null },
  });

  const out = await retryContentJob(body.jobId, { skipVideo: body.skipVideo === true });
  if (!out.ok) {
    return NextResponse.json({ error: out.error ?? "Retry failed" }, { status: 422 });
  }
  return NextResponse.json({ ok: true, jobId: body.jobId });
}
