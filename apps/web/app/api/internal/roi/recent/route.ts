import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { hostEconomicsFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** GET /api/internal/roi/recent — admin read-only. */
export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!hostEconomicsFlags.roiCalculatorV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(50, Math.max(1, Number(url.searchParams.get("take") ?? "20")));

  const rows = await prisma.roiCalculation.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      userId: true,
      leadId: true,
      listingId: true,
      createdAt: true,
      input: true,
      output: true,
    },
  });

  return NextResponse.json({ ok: true, rows });
}
