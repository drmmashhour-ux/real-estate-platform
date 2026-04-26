import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET /api/monetization/plan-tiers — public Free / Pro / Platinum rows from DB. */
export async function GET() {
  try {
    const rows = await prisma.monetizationPlanTier.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        name: true,
        description: true,
        priceCentsMonthly: true,
        currency: true,
        storageBytesHint: true,
        features: true,
      },
    });
    const serialized = rows.map((r) => ({
      ...r,
      storageBytesHint: r.storageBytesHint != null ? r.storageBytesHint.toString() : null,
    }));
    return NextResponse.json({ tiers: serialized });
  } catch {
    return NextResponse.json({ tiers: [], error: "tiers_unavailable" }, { status: 200 });
  }
}
