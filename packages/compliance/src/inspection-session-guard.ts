import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

export type InspectionGuardContext = {
  ownerType: string;
  ownerId: string;
  actorId: string;
  actorType?: string;
};

/**
 * When a valid **read-only** inspection session token is present on a mutating request, run the guardrail
 * engine and block the write. Callers must supply owner scope for decision partitioning (agency vs solo).
 */
export async function rejectIfInspectionReadOnlyMutation(
  req: Request,
  ctx: InspectionGuardContext,
): Promise<NextResponse | null> {
  const token = req.headers.get("x-inspection-session")?.trim();
  if (!token) return null;

  const session = await prisma.inspectionAccessSession.findUnique({
    where: { sessionToken: token },
  });

  const active =
    session &&
    !session.revokedAt &&
    (!session.expiresAt || session.expiresAt.getTime() >= Date.now());

  if (!active || !session.readOnly) {
    return null;
  }

  const r = await enforceComplianceAction({
    ownerType: ctx.ownerType,
    ownerId: ctx.ownerId,
    moduleKey: "inspection",
    actionKey: "write_operation",
    entityType: "inspection_session",
    entityId: session.id,
    actorType: ctx.actorType ?? "broker",
    actorId: ctx.actorId,
    facts: { readOnlyInspectionActive: true },
  });

  if (!r.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: r.reasonCode ?? "INSPECTION_MODE_READ_ONLY",
        message: r.message,
        decisionId: r.decisionId,
      },
      { status: 403 },
    );
  }

  return null;
}

/** For service-layer callers that must throw instead of returning a `NextResponse`. */
export async function assertInspectionMutationAllowed(
  req: Request,
  ctx: InspectionGuardContext,
): Promise<void> {
  const blocked = await rejectIfInspectionReadOnlyMutation(req, ctx);
  if (blocked) {
    throw new Error("READ_ONLY_MODE");
  }
}
