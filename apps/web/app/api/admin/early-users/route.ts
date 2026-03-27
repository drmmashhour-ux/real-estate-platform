import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { EarlyUserTrackingType, EarlyUserTrackingStatus, LeadPriorityTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

const STATUSES = new Set<string>(Object.values(EarlyUserTrackingStatus));
const TIERS = new Set<string>(Object.values(LeadPriorityTier));

export async function GET(req: NextRequest) {
  const err = await assertAdminResponse();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const leadTier = searchParams.get("leadTier");

  const where: Prisma.EarlyUserTrackingWhereInput = {};
  if (status && STATUSES.has(status)) {
    where.status = status as EarlyUserTrackingStatus;
  }
  if (source && source !== "all") {
    where.source = source;
  }
  if (leadTier && leadTier !== "all" && TIERS.has(leadTier)) {
    where.leadTier = leadTier as LeadPriorityTier;
  }

  const rows = await prisma.earlyUserTracking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { id: true, email: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;
  const body = await req.json().catch(() => ({}));
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const typeRaw = typeof body.type === "string" ? body.type.toUpperCase() : "";
  const type =
    typeRaw === "HOST"
      ? EarlyUserTrackingType.HOST
      : typeRaw === "GUEST"
        ? EarlyUserTrackingType.GUEST
        : null;
  if (!contact || !type) {
    return NextResponse.json({ error: "contact and type (HOST|GUEST) required" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const source = typeof body.source === "string" ? body.source.trim().slice(0, 64) || null : null;
  const conversionStage =
    typeof body.conversionStage === "string" ? body.conversionStage.trim().slice(0, 64) || null : null;
  let conversionDate: Date | null = null;
  if (typeof body.conversionDate === "string" && body.conversionDate) {
    const d = new Date(body.conversionDate);
    if (!Number.isNaN(d.getTime())) conversionDate = d;
  }
  let followUpAt: Date | null = null;
  if (typeof body.followUpAt === "string" && body.followUpAt) {
    const d = new Date(body.followUpAt);
    if (!Number.isNaN(d.getTime())) followUpAt = d;
  }
  let conversionScore: number | null = null;
  if (typeof body.conversionScore === "number" && Number.isFinite(body.conversionScore)) {
    conversionScore = Math.max(0, Math.min(100, Math.round(body.conversionScore)));
  }
  let leadTier: LeadPriorityTier | null = null;
  if (typeof body.leadTier === "string" && TIERS.has(body.leadTier.toUpperCase())) {
    leadTier = body.leadTier.toUpperCase() as LeadPriorityTier;
  }
  let lastOutreachAt: Date | null = null;
  if (typeof body.lastOutreachAt === "string" && body.lastOutreachAt) {
    const d = new Date(body.lastOutreachAt);
    if (!Number.isNaN(d.getTime())) lastOutreachAt = d;
  }

  const row = await prisma.earlyUserTracking.create({
    data: {
      contact,
      type,
      name,
      notes,
      source,
      conversionStage,
      conversionDate,
      followUpAt,
      conversionScore,
      leadTier,
      lastOutreachAt,
    },
    include: { user: { select: { id: true, email: true } } },
  });
  return NextResponse.json(row);
}
