import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { listApprovalQueue } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await listApprovalQueue();
  const items = rows.map((row) => {
    const validation = (row.validationSummary ?? {}) as Record<string, unknown>;
    const completeness = Number(validation.completenessPercent ?? 0);
    const contradictionCount = Array.isArray(validation.contradictionFlags) ? validation.contradictionFlags.length : 0;
    const warningCount = Array.isArray(validation.warningFlags) ? validation.warningFlags.length : 0;
    const riskScore = row.listing?.riskScore ?? null;
    const riskLevel = riskScore == null ? "unknown" : riskScore >= 70 ? "high" : riskScore >= 45 ? "medium" : "low";
    return {
      documentId: row.id,
      title: "Seller Declaration",
      property: row.listing ? `${row.listing.title} - ${row.listing.address}, ${row.listing.city}` : row.listingId,
      status: row.status,
      riskLevel,
      completionPercent: completeness,
      updatedAt: row.updatedAt,
      contradictionCount,
      warningCount,
    };
  });

  return NextResponse.json({ items });
}
