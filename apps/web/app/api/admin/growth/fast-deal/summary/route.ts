import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { buildFastDealSummary } from "@/modules/growth/fast-deal-results.service";

export const dynamic = "force-dynamic";

/** GET — deterministic Fast Deal summary (admin only). */
export async function GET() {
  if (!engineFlags.fastDealResultsV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await buildFastDealSummary();
  return NextResponse.json({
    summary,
    disclaimer:
      "Internal attribution and counts only — operators log actions explicitly; rankings are not causal proof.",
  });
}
