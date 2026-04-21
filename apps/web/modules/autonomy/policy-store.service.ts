import { prisma } from "@/lib/db";
import type { AutonomyMode, AutonomyRiskLevel, PolicyScopeType } from "@/modules/autonomy/autonomy.types";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";

export async function listActivePolicies() {
  try {
    return await prisma.autonomousPolicySetting.findMany({
      where: { isActive: true },
      orderBy: [{ scopeType: "asc" }, { scopeKey: "asc" }, { version: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function createPolicyVersion(input: {
  scopeType: PolicyScopeType;
  scopeKey: string;
  autonomyMode: AutonomyMode;
  allowedActionTypes: string[];
  blockedActionTypes: string[];
  maxRiskLevel: AutonomyRiskLevel;
  requireApprovalFor: string[];
  emergencyFreeze: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const latest = await prisma.autonomousPolicySetting.findFirst({
      where: { scopeType: input.scopeType, scopeKey: input.scopeKey },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    await prisma.autonomousPolicySetting.updateMany({
      where: { scopeType: input.scopeType, scopeKey: input.scopeKey, isActive: true },
      data: { isActive: false },
    });

    const row = await prisma.autonomousPolicySetting.create({
      data: {
        scopeType: input.scopeType,
        scopeKey: input.scopeKey,
        autonomyMode: input.autonomyMode,
        allowedActionTypesJson: input.allowedActionTypes,
        blockedActionTypesJson: input.blockedActionTypes,
        maxRiskLevel: input.maxRiskLevel,
        requireApprovalForJson: input.requireApprovalFor,
        emergencyFreeze: input.emergencyFreeze,
        isActive: true,
        version: nextVersion,
      },
    });
    autonomyLog.policyUpdated({ id: row.id, scope: `${input.scopeType}:${input.scopeKey}`, version: nextVersion });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "policy_create_failed" };
  }
}
