import type { GrowthOpsManualAdSpend } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { listGrowthOpsManualSpendRows } from "@/modules/ads/growth-ops-manual-spend.service";

export const dynamic = "force-dynamic";

function parseDateUtc(iso: string): Date | null {
  const t = iso?.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
}

/** Inclusive end date → exclusive period end (next day 00:00 UTC). */
function endInclusiveToExclusive(endInclusive: Date): Date {
  return new Date(endInclusive.getTime() + 864e5);
}

/**
 * GET — list recent manual spend rows (admin).
 * POST — add row: utmCampaign, periodStart, periodEnd (inclusive YYYY-MM-DD), spendDollars, note?
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const rows = await listGrowthOpsManualSpendRows(80);
  return NextResponse.json({
    rows: rows.map((r: GrowthOpsManualAdSpend) => ({
      id: r.id,
      utmCampaign: r.utmCampaign,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      spendCents: r.spendCents,
      currency: r.currency,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const utmCampaign = typeof b.utmCampaign === "string" ? b.utmCampaign.trim() : "";
  const periodStartStr = typeof b.periodStart === "string" ? b.periodStart : "";
  const periodEndInclusiveStr = typeof b.periodEnd === "string" ? b.periodEnd : "";
  const spendDollarsRaw = b.spendDollars;
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 512) : null;

  if (!utmCampaign) {
    return NextResponse.json({ error: "utmCampaign is required" }, { status: 400 });
  }

  const periodStart = parseDateUtc(periodStartStr);
  const periodEndInclusive = parseDateUtc(periodEndInclusiveStr);
  if (!periodStart || !periodEndInclusive) {
    return NextResponse.json({ error: "periodStart and periodEnd must be YYYY-MM-DD" }, { status: 400 });
  }
  const periodEnd = endInclusiveToExclusive(periodEndInclusive);
  if (periodEnd.getTime() <= periodStart.getTime()) {
    return NextResponse.json({ error: "periodEnd must be on or after periodStart" }, { status: 400 });
  }

  const spendNum =
    typeof spendDollarsRaw === "number"
      ? spendDollarsRaw
      : typeof spendDollarsRaw === "string"
        ? parseFloat(spendDollarsRaw)
        : NaN;
  if (!Number.isFinite(spendNum) || spendNum < 0) {
    return NextResponse.json({ error: "spendDollars must be a non-negative number" }, { status: 400 });
  }
  const spendCents = Math.round(spendNum * 100);
  if (spendCents > 1_000_000_000) {
    return NextResponse.json({ error: "spend too large" }, { status: 400 });
  }

  const row = await prisma.growthOpsManualAdSpend.create({
    data: {
      utmCampaign,
      periodStart,
      periodEnd,
      spendCents,
      note: note || null,
    },
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
  });
}
