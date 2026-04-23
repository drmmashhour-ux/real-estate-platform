import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { approveAdjustmentProposal } from "@/lib/appraisal/review-proposals";
import { canAccessDealAnalysisForListing } from "@/lib/appraisal/deal-analysis-access";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  proposalId: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const proposal = await prisma.appraisalAdjustmentProposal.findUnique({
    where: { id: body.proposalId },
    select: { appraisalCaseId: true },
  });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canAccessDealAnalysisForListing(proposal.appraisalCaseId, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await approveAdjustmentProposal({
      proposalId: body.proposalId,
      reviewedById: auth.user.id,
    });
    return NextResponse.json({ success: true, proposal: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "APPROVE_FAILED";
    const status = msg === "PROPOSAL_NOT_FOUND" ? 404 : msg === "PROPOSAL_ALREADY_REVIEWED" ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
