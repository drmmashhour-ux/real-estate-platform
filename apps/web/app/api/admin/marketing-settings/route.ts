import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const row = await prisma.marketingSettings.upsert({
    where: { id: "default" },
    create: { id: "default", manualAdSpendCad: 0 },
    update: {},
  });

  return NextResponse.json({
    manualAdSpendCad: row.manualAdSpendCad,
    updatedAt: row.updatedAt,
  });
}

export async function PATCH(req: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = body.manualAdSpendCad;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) {
    return NextResponse.json({ error: "manualAdSpendCad must be 0–100000000 (CAD)" }, { status: 400 });
  }
  const manualAdSpendCad = Math.round(n);

  const row = await prisma.marketingSettings.upsert({
    where: { id: "default" },
    create: { id: "default", manualAdSpendCad },
    update: { manualAdSpendCad },
  });

  return NextResponse.json({
    manualAdSpendCad: row.manualAdSpendCad,
    updatedAt: row.updatedAt,
  });
}
