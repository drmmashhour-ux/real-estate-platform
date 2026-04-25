import { PlatformRole } from "@prisma/client";
import type { ComplianceActorProfile, DelegatedAuthority, SupervisionAssignment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateRoleAuthorization } from "@/lib/compliance/authorization-matrix";
import { validateDelegation } from "@/lib/compliance/delegation";
import { resolveAccountableActor } from "@/lib/compliance/accountability";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export type EnforceAuthorizationInput = {
  ownerType: string;
  ownerId: string;
  actorId: string;
  actionKey: string;
  entityType: string;
  entityId?: string | null;
  scopeType?: string;
  scopeId?: string | null;
  /** When true, creates a `DelegatedApprovalTask` for employee/assistant delegated work awaiting licensee approval. */
  submitDelegatedApproval?: boolean;
};

export type EnforceAuthorizationResult = {
  actor: ComplianceActorProfile;
  delegation: DelegatedAuthority | null;
  supervision: SupervisionAssignment | null;
  accountability: { accountableActorId: string; supervisorActorId: string | null };
  requiresApproval: boolean;
  delegatedApprovalTaskId: string | null;
};

/**
 * Ensures a profile exists so existing users are not hard-bricked before admin backfill.
 * Brokers default to `licenseStatus: active`; adjust via admin when licence integration is source-of-truth.
 */
export async function ensureComplianceActorProfile(actorId: string): Promise<ComplianceActorProfile> {
  const trimmed = actorId.trim();
  const existing = await prisma.complianceActorProfile.findUnique({ where: { userId: trimmed } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: trimmed }, select: { role: true } });
  if (!user) throw new Error("UNAUTHORIZED_ACTOR");

  const actorType =
    user.role === PlatformRole.ADMIN ? "platform_admin" : user.role === PlatformRole.BROKER ? "solo_broker" : "employee";

  return prisma.complianceActorProfile.create({
    data: {
      userId: trimmed,
      actorType,
      licenseStatus: user.role === PlatformRole.BROKER ? "active" : "not_applicable",
      active: true,
    },
  });
}

export async function enforceAuthorization(input: EnforceAuthorizationInput): Promise<EnforceAuthorizationResult> {
  const actor = await ensureComplianceActorProfile(input.actorId);
  if (!actor.active) {
    throw new Error("ACTIVE_ACTOR_PROFILE_REQUIRED");
  }

  const roleDecision = evaluateRoleAuthorization({
    actorType: actor.actorType,
    licenseStatus: actor.licenseStatus,
    actionKey: input.actionKey,
  });

  if (!roleDecision.allowed) {
    await logAuditEvent({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      entityType: input.entityType,
      entityId: (input.entityId ?? "unknown").trim() || "unknown",
      actionType: "authorization_blocked",
      moduleKey: "general",
      actorType: actor.actorType,
      actorId: actor.userId,
      severity: "high",
      summary: `Authorization blocked: ${roleDecision.reason}`,
      details: { actionKey: input.actionKey },
    });
    throw new Error(roleDecision.reason);
  }

  const employeeLike = ["employee", "assistant"].includes(actor.actorType);
  let delegation: DelegatedAuthority | null = null;
  let delegationDecision: { allowed: true; requiresApproval: boolean } = { allowed: true, requiresApproval: false };

  if (employeeLike) {
    const scopeType = input.scopeType ?? "global";
    const scopeId = input.scopeId ?? null;

    delegation = await prisma.delegatedAuthority.findFirst({
      where: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        delegateActorId: actor.userId,
        authorityKey: input.actionKey,
        revokedAt: null,
        OR: [{ scopeType: "global", scopeId: null }, { scopeType, scopeId }],
      },
      orderBy: { createdAt: "desc" },
    });

    delegationDecision = validateDelegation({
      delegationExists: !!delegation,
      revokedAt: delegation?.revokedAt ?? null,
      startsAt: delegation?.startsAt ?? null,
      endsAt: delegation?.endsAt ?? null,
      requiresApproval: delegation?.requiresApproval ?? true,
      canExecute: delegation?.canExecute ?? false,
    });

    if (!delegationDecision.allowed) {
      await logAuditEvent({
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        entityType: input.entityType,
        entityId: (input.entityId ?? "unknown").trim() || "unknown",
        actionType: "authorization_blocked",
        moduleKey: "general",
        actorType: actor.actorType,
        actorId: actor.userId,
        severity: "high",
        summary: `Delegation invalid: ${delegationDecision.reason}`,
        details: { actionKey: input.actionKey },
      });
      throw new Error(delegationDecision.reason);
    }
  }

  let supervision: SupervisionAssignment | null = null;
  if (actor.supervisingActorId) {
    supervision = await prisma.supervisionAssignment.findFirst({
      where: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        supervisedActorId: actor.userId,
        supervisorActorId: actor.supervisingActorId,
        active: true,
        revokedAt: null,
      },
    });
  }

  const accountability = resolveAccountableActor({
    actorId: actor.userId,
    actorType: actor.actorType,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    actionKey: input.actionKey,
    supervisorActorId: supervision?.supervisorActorId ?? actor.supervisingActorId ?? null,
    approvalActorId: delegation?.approvalActorId ?? null,
    delegated: !!delegation,
  });

  let delegatedApprovalTaskId: string | null = null;
  if (
    input.submitDelegatedApproval &&
    employeeLike &&
    delegation &&
    delegation.requiresApproval &&
    delegationDecision.allowed
  ) {
    const approver = delegation.approvalActorId ?? supervision?.supervisorActorId ?? actor.supervisingActorId;
    if (!approver) {
      throw new Error("APPROVER_REQUIRED");
    }
    const task = await prisma.delegatedApprovalTask.create({
      data: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        delegationId: delegation.id,
        entityType: input.entityType,
        entityId: (input.entityId ?? "").trim() || "unknown",
        actionKey: input.actionKey,
        requestedByActorId: actor.userId,
        approverActorId: approver,
        status: "pending",
      },
    });
    delegatedApprovalTaskId = task.id;
    await logAuditEvent({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      entityType: "delegated_approval_task",
      entityId: task.id,
      actionType: "delegated_action_submitted",
      moduleKey: "general",
      actorType: actor.actorType,
      actorId: actor.userId,
      severity: "info",
      summary: "Delegated action submitted for approval",
      details: { actionKey: input.actionKey, approverActorId: approver, delegationId: delegation.id },
    });
  }

  const requiresApproval =
    !!roleDecision.requiresApproval ||
    (employeeLike && delegationDecision.allowed && !!delegationDecision.requiresApproval) ||
    !!delegatedApprovalTaskId;

  return {
    actor,
    delegation,
    supervision,
    accountability,
    requiresApproval,
    delegatedApprovalTaskId,
  };
}
