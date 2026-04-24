import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { updateEsgActionStatus } from "@/modules/esg/esg-action-status.service";
import { userCanAccessEsgActionCenter } from "@/modules/esg/esg-action-center.service";
import {
  captureRetrofitUpstreamFingerprint,
  scheduleDebouncedRetrofitUpstreamRefresh,
} from "@/modules/esg/esg-retrofit-upstream-refresh";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-action-status]";

const ALLOWED = new Set(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "DISMISSED"]);

export async function POST(req: NextRequest, context: { params: Promise<{ actionId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { actionId } = await context.params;
  if (!actionId?.trim()) return NextResponse.json({ error: "actionId required" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  const status = typeof body.status === "string" ? body.status.trim().toUpperCase() : "";
  if (!ALLOWED.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const row = await prisma.esgAction.findUnique({
    where: { id: actionId },
    select: { listingId: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = await userCanAccessEsgActionCenter(userId, row.listingId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fpBefore = await captureRetrofitUpstreamFingerprint(row.listingId);

  const result = await updateEsgActionStatus({
    actionId,
    actorUserId: userId,
    status: status as "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "DISMISSED",
    note: body.note,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  logInfo(`${TAG} api ok`, { actionId, status });
  scheduleDebouncedRetrofitUpstreamRefresh(row.listingId, "evidence", fpBefore);
  return NextResponse.json({ ok: true });
}
