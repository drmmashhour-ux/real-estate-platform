import { prisma } from "@/lib/db";
import { requireComplianceAdminApproval } from "@/lib/contracts/compliance-gates";

export async function assertComplianceReviewApprovedIfRequired(
  listingId: string
): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  if (!requireComplianceAdminApproval()) return { ok: true };

  const row = await prisma.listingComplianceReview.findUnique({
    where: { listingId },
    select: { status: true },
  });
  if (!row || row.status !== "approved") {
    return {
      ok: false,
      reasons: [
        "An administrator must approve this listing in the compliance queue before it can be published.",
      ],
    };
  }
  return { ok: true };
}

/** Create a pending review row when seller completes declaration (optional workflow). */
export async function ensureComplianceReviewPending(listingId: string): Promise<void> {
  if (!requireComplianceAdminApproval()) return;

  await prisma.listingComplianceReview.upsert({
    where: { listingId },
    create: { listingId, status: "pending" },
    update: {},
  });
}
