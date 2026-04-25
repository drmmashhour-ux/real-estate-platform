import { NextRequest, NextResponse } from "next/server";
import {
  ContentAutomationContentStyle,
  ContentAutomationPlatformTarget,
} from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { createContentJob, runContentAutomationPipeline } from "@/lib/content-automation/pipeline";
import { prisma } from "@repo/db";

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
 * Host (owner) or admin: enqueue content automation for a BNHUB listing.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: listingId } = await params;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const admin = await isPlatformAdmin(userId);
  if (listing.ownerId !== userId && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    run?: boolean;
    skipVideo?: boolean;
    platformTarget?: string;
    contentStyle?: string;
  };

  const { id: jobId } = await createContentJob({
    listingId,
    platformTarget: parsePlatformTarget(body.platformTarget),
    contentStyle: parseContentStyle(body.contentStyle),
    approvalRequired: true,
  });

  if (body.run !== false) {
    const out = await runContentAutomationPipeline({
      jobId,
      skipVideo: body.skipVideo === true,
    });
    if (!out.ok) {
      return NextResponse.json({ error: out.error ?? "Pipeline failed", jobId }, { status: 422 });
    }
  }

  return NextResponse.json({ ok: true, jobId });
}
