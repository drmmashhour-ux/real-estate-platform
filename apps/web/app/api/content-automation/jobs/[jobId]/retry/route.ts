import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { retryContentJob } from "@/lib/content-automation/retry-job";

export const dynamic = "force-dynamic";

/** @deprecated Prefer POST /api/content-automation/retry with body { jobId } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await params;
  const body = (await req.json().catch(() => ({}))) as { skipVideo?: boolean };

  const out = await retryContentJob(jobId, { skipVideo: body.skipVideo === true });
  if (!out.ok) {
    return NextResponse.json({ error: out.error ?? "Retry failed" }, { status: 422 });
  }
  return NextResponse.json({ ok: true, jobId });
}
