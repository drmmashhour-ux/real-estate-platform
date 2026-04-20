import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBnhubInvestorPortalAccessApi } from "@/modules/investor/auth/require-bnhub-investor-portal-api";

export const dynamic = "force-dynamic";

function parseDeliveryMeta(meta: unknown): {
  revenue: number;
  bookings: number;
  occupancyRate?: number;
  adr?: number;
  revpar?: number;
} {
  if (!meta || typeof meta !== "object") {
    return { revenue: 0, bookings: 0 };
  }
  const m = meta as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v)) || 0;
  return {
    revenue: num(m.revenue),
    bookings: Math.round(num(m.bookings)),
    occupancyRate: m.occupancyRate !== undefined ? num(m.occupancyRate) : undefined,
    adr: m.adr !== undefined ? num(m.adr) : undefined,
    revpar: m.revpar !== undefined ? num(m.revpar) : undefined,
  };
}

/** Time-series from **successful** report deliveries only (meta captured at send time). Scope from session — never pass `scopeId`. */
export async function GET() {
  const gate = await requireBnhubInvestorPortalAccessApi();
  if (!gate.ok) return gate.response;

  const logs = await prisma.reportDeliveryLog.findMany({
    where: {
      scopeType: gate.investor.scopeType,
      scopeId: gate.investor.scopeId,
      status: "success",
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, meta: true },
  });

  const data = logs.map((l) => {
    const k = parseDeliveryMeta(l.meta);
    return {
      date: l.createdAt.toISOString(),
      revenue: k.revenue,
      bookings: k.bookings,
      occupancyRate: k.occupancyRate,
      adr: k.adr,
      revpar: k.revpar,
    };
  });

  return NextResponse.json({ success: true, data });
}
