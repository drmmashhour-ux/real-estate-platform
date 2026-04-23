import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { EarlyUserTrackingStatus, LeadPriorityTier } from "@prisma/client";
import { prisma } from "@repo/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

const STATUSES = new Set<string>(Object.values(EarlyUserTrackingStatus));
const TIERS = new Set<string>(Object.values(LeadPriorityTier));

function parseOptionalDate(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: Prisma.EarlyUserTrackingUpdateInput = {};

  if (typeof body.status === "string") {
    const s = body.status.toUpperCase();
    if (!STATUSES.has(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = s as EarlyUserTrackingStatus;
  }
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
  if (body.userId === null) data.user = { disconnect: true };
  if (typeof body.userId === "string" && body.userId.trim()) {
    data.user = { connect: { id: body.userId.trim() } };
  }
  if (typeof body.source === "string") data.source = body.source.trim().slice(0, 64) || null;
  if (typeof body.conversionStage === "string") data.conversionStage = body.conversionStage.trim().slice(0, 64) || null;
  const conv = parseOptionalDate(body.conversionDate);
  if (conv !== undefined) data.conversionDate = conv;
  const fu = parseOptionalDate(body.followUpAt);
  if (fu !== undefined) data.followUpAt = fu;
  if (body.conversionScore === null) data.conversionScore = null;
  if (typeof body.conversionScore === "number" && Number.isFinite(body.conversionScore)) {
    data.conversionScore = Math.max(0, Math.min(100, Math.round(body.conversionScore)));
  }
  if (body.leadTier === null) data.leadTier = null;
  if (typeof body.leadTier === "string" && body.leadTier.trim()) {
    const t = body.leadTier.toUpperCase();
    if (!TIERS.has(t)) {
      return NextResponse.json({ error: "Invalid leadTier" }, { status: 400 });
    }
    data.leadTier = t as LeadPriorityTier;
  }
  const lo = parseOptionalDate(body.lastOutreachAt);
  if (lo !== undefined) data.lastOutreachAt = lo;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  try {
    const row = await prisma.earlyUserTracking.update({
      where: { id },
      data,
      include: { user: { select: { id: true, email: true } } },
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
