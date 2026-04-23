import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { logComplianceModuleAudit } from "@/lib/compliance/compliance-module-audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  proposalId: z.string().min(1),
  approved: z.boolean(),
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

  const existing = await prisma.aiAutopilotProposal.findUnique({
    where: { id: body.proposalId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, existing.ownerType, existing.ownerId);
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: 403 });
  }

  if (existing.reviewed) {
    return NextResponse.json({ error: "PROPOSAL_ALREADY_REVIEWED" }, { status: 409 });
  }

  const updated = await prisma.aiAutopilotProposal.update({
    where: { id: body.proposalId },
    data: {
      reviewed: true,
      approved: body.approved,
      reviewedById: auth.user.id,
    },
  });

  await logComplianceModuleAudit({
    actorUserId: auth.user.id,
    action: body.approved ? "ai_autopilot_proposal_approved" : "ai_autopilot_proposal_rejected",
    payload: { entityId: updated.id, moduleKey: updated.moduleKey },
  });

  return NextResponse.json({ success: true, proposal: updated });
}
