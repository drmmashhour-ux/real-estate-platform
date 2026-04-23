import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const };
}

/** GET ?take=200 — list recent market data points */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const take = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get("take")) || 200));
  const rows = await prisma.marketDataPoint.findMany({
    orderBy: { date: "desc" },
    take,
  });
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  let body: {
    city?: string;
    postalCode?: string | null;
    propertyType?: string;
    avgPriceCents?: number;
    medianPriceCents?: number | null;
    avgRentCents?: number | null;
    transactions?: number | null;
    inventory?: number | null;
    date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const city = (body.city ?? "").trim();
  const propertyType = (body.propertyType ?? "").trim();
  const avgPriceCents = typeof body.avgPriceCents === "number" ? body.avgPriceCents : NaN;
  const dateStr = body.date;

  if (!city || !propertyType || !Number.isFinite(avgPriceCents) || avgPriceCents <= 0 || !dateStr) {
    return NextResponse.json(
      { error: "city, propertyType, avgPriceCents (>0), and date (ISO) are required" },
      { status: 400 }
    );
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const row = await prisma.marketDataPoint.create({
    data: {
      city,
      postalCode: body.postalCode ?? null,
      propertyType,
      avgPriceCents: Math.round(avgPriceCents),
      medianPriceCents: body.medianPriceCents != null ? Math.round(body.medianPriceCents) : null,
      avgRentCents: body.avgRentCents != null ? Math.round(body.avgRentCents) : null,
      transactions: body.transactions,
      inventory: body.inventory,
      date,
    },
  });

  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.marketDataPoint.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
