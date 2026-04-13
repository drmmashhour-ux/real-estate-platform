import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  ContentAutomationContentStyle,
  ContentAutomationPlatformTarget,
} from "@prisma/client";
import { createContentJob, runContentAutomationPipeline } from "@/lib/content-automation/pipeline";

export const dynamic = "force-dynamic";

function parsePlatformTarget(
  v: string | undefined
): ContentAutomationPlatformTarget | undefined {
  if (!v) return undefined;
  if (v === "TIKTOK" || v === "INSTAGRAM" || v === "BOTH")
    return ContentAutomationPlatformTarget[v];
  return undefined;
}

function parseContentStyle(v: string | undefined): ContentAutomationContentStyle | undefined {
  if (!v) return undefined;
  const allowed: (keyof typeof ContentAutomationContentStyle)[] = [
    "PRICE_SHOCK",
    "LIFESTYLE",
    "COMPARISON",
    "QUESTION",
    "HIDDEN_GEM",
    "ALL_FIVE",
  ];
  if (allowed.includes(v as keyof typeof ContentAutomationContentStyle)) {
    return ContentAutomationContentStyle[v as keyof typeof ContentAutomationContentStyle];
  }
  return undefined;
}

/**
 * Run pipeline for a job, or create a job from listingId then run.
 * Auth: platform admin, or `x-cron-secret` matching CRON_SECRET for workers.
 */
export async function POST(req: NextRequest) {
  const cron = req.headers.get("x-cron-secret");
  const cronOk = Boolean(process.env.CRON_SECRET && cron === process.env.CRON_SECRET);

  const userId = await getGuestId();
  const admin = userId ? await isPlatformAdmin(userId) : false;
  if (!cronOk && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    listingId?: string;
    skipVideo?: boolean;
    platformTarget?: string;
    contentStyle?: string;
  };

  try {
    if (body.listingId) {
      const { id: jobId } = await createContentJob({
        listingId: body.listingId,
        platformTarget: parsePlatformTarget(body.platformTarget),
        contentStyle: parseContentStyle(body.contentStyle),
      });
      const out = await runContentAutomationPipeline({
        jobId,
        skipVideo: body.skipVideo === true,
      });
      if (!out.ok) {
        return NextResponse.json({ error: out.error ?? "Pipeline failed", jobId }, { status: 422 });
      }
      return NextResponse.json({ ok: true, jobId });
    }

    if (body.jobId) {
      const out = await runContentAutomationPipeline({
        jobId: body.jobId,
        skipVideo: body.skipVideo === true,
      });
      if (!out.ok) {
        return NextResponse.json({ error: out.error ?? "Pipeline failed" }, { status: 422 });
      }
      return NextResponse.json({ ok: true, jobId: body.jobId });
    }

    return NextResponse.json({ error: "Provide listingId or jobId" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
