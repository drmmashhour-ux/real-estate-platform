import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { workflowToClientDto } from "@/lib/workflows/dto";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  workflowId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.aIWorkflow.findFirst({
    where: { id: parsed.data.workflowId, ownerId: auth.id },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const wf = await prisma.aIWorkflow.update({
    where: { id: existing.id },
    data: { status: "approved" },
  });

  await recordAuditEvent({
    actorUserId: auth.id,
    action: "AI_WORKFLOW_APPROVED",
    payload: { workflowId: wf.id, type: wf.type },
  });

  return NextResponse.json({ success: true, workflow: workflowToClientDto(wf) });
}
