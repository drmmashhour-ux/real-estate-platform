import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { listContentJobs } from "@/lib/content-automation/dao";
import type { ContentAutomationJobStatus, ContentAutomationPlatformTarget } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId") ?? undefined;
  const status = searchParams.get("status") as ContentAutomationJobStatus | undefined;
  const platform = searchParams.get("platform") as ContentAutomationPlatformTarget | undefined;
  const take = Math.min(Number(searchParams.get("take")) || 50, 200);

  try {
    const rows = await listContentJobs({
      listingId,
      status,
      platformTarget: platform,
      take,
    });
    return NextResponse.json({ ok: true, jobs: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
