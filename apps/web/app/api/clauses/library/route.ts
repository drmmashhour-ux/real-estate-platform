import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";
import { getClausesLibraryGrouped } from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";

export const dynamic = "force-dynamic";

/** GET /api/clauses/library — active standardized clauses grouped by category. */
export async function GET() {
  if (!complianceFlags.oaciqClauseComplianceEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const grouped = await getClausesLibraryGrouped();
  return NextResponse.json({ categories: grouped });
}
