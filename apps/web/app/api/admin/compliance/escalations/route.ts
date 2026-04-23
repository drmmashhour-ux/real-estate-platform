import type { ComplianceEscalationTargetRole, ComplianceEscalationType } from "@prisma/client";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { createEscalation, resolveEscalation } from "@/modules/compliance-ops/escalation-engine.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.supervisoryQueueV1) {
    return Response.json({ error: "Supervisory queue disabled" }, { status: 403 });
  }

  const escalations = await prisma.complianceEscalation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { complianceCase: { select: { id: true, summary: true, severity: true, dealId: true } } },
  });
  return Response.json({ escalations });
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.supervisoryQueueV1) {
    return Response.json({ error: "Supervisory queue disabled" }, { status: 403 });
  }

  let body:
    | {
        action?: "create" | "resolve";
        caseId?: string;
        escalationType?: ComplianceEscalationType;
        targetRole?: ComplianceEscalationTargetRole;
        escalationId?: string;
      };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "resolve" && body.escalationId) {
    const row = await resolveEscalation(body.escalationId, admin.userId);
    return Response.json({ escalation: row });
  }

  if (!body.caseId || !body.escalationType || !body.targetRole) {
    return Response.json({ error: "caseId, escalationType, targetRole required" }, { status: 400 });
  }

  const row = await createEscalation({
    actorUserId: admin.userId,
    caseId: body.caseId,
    escalationType: body.escalationType,
    targetRole: body.targetRole,
  });
  return Response.json({ escalation: row });
}
