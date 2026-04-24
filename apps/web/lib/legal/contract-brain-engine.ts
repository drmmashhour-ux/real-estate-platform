import { prisma } from "@/lib/db";
import {
  CONTRACT_BRAIN_NOTICE_DEFINITIONS,
  LIMITED_ROLE_NOTICE_KEY,
  formatNoticeSnapshotBody,
  getContractBrainNoticeDefinition,
} from "@/lib/legal/contract-brain-notices";
import { getContractBrainMetaFromContent, mergeContractBrainIntoPrismaContent } from "@/lib/legal/contract-brain-content";
import type { ContractBrainContext } from "@/lib/legal/contract-brain-types";
import { injectLimitedRoleNoticeIntoHtml } from "@/lib/legal/contract-brain-html";
import { logContractBrain } from "@/lib/legal/contract-brain-logger";
import type { Prisma } from "@prisma/client";

export function computeRequiredNoticeKeysFromContext(ctx: ContractBrainContext | undefined): string[] {
  if (!ctx?.role) return [];
  if (ctx.role === "BUYER" && ctx.isBuyerRepresented === false) {
    return [LIMITED_ROLE_NOTICE_KEY];
  }
  if (ctx.role === "TENANT" && ctx.isTenantRepresented === false) {
    return [LIMITED_ROLE_NOTICE_KEY];
  }
  return [];
}

export function resolveRequiredNoticeKeysForEvaluation(
  contractContent: unknown,
  context?: ContractBrainContext
): string[] {
  const stored = getContractBrainMetaFromContent(contractContent).requiredNoticeKeys;
  if (stored.length > 0) return [...new Set(stored)];
  return computeRequiredNoticeKeysFromContext(context);
}

export function injectNoticesIntoDraft(params: {
  html: string;
  contentJson: Prisma.JsonValue | null | undefined;
  context?: ContractBrainContext;
}): { html: string; content: Prisma.InputJsonValue } {
  const keysFromContext = computeRequiredNoticeKeysFromContext(params.context);
  const metaStored = getContractBrainMetaFromContent(params.contentJson);
  const keys = metaStored.requiredNoticeKeys.length > 0 ? metaStored.requiredNoticeKeys : keysFromContext;
  if (!keys.includes(LIMITED_ROLE_NOTICE_KEY)) {
    return { html: params.html, content: (params.contentJson ?? {}) as Prisma.InputJsonValue };
  }
  const def = CONTRACT_BRAIN_NOTICE_DEFINITIONS.LIMITED_ROLE_NOTICE;
  const html = injectLimitedRoleNoticeIntoHtml(params.html, def);
  const merged = mergeContractBrainIntoPrismaContent(params.contentJson, {
    requiredNoticeKeys: [...new Set([...metaStored.requiredNoticeKeys, ...keys])],
    snapshotVersionByKey: {
      ...metaStored.snapshotVersionByKey,
      [LIMITED_ROLE_NOTICE_KEY]: def.version,
    },
  });
  return { html, content: merged };
}

export async function listAcknowledgedNoticeKeys(params: {
  contractId: string;
  userId: string;
}): Promise<Set<string>> {
  const rows = await prisma.contractLegalNotice.findMany({
    where: {
      contractId: params.contractId,
      userId: params.userId,
      acceptedAt: { not: null },
    },
    select: { noticeKey: true },
  });
  return new Set(rows.map((r) => r.noticeKey));
}

export type SignatureGateResult = {
  canSign: boolean;
  missingNotices: string[];
  reason: string;
};

export async function evaluateContractBrainSignatureGate(params: {
  contractId: string;
  userId: string;
  contractContent: unknown;
  context?: ContractBrainContext;
}): Promise<SignatureGateResult> {
  const required = resolveRequiredNoticeKeysForEvaluation(params.contractContent, params.context);
  if (required.length === 0) {
    return { canSign: true, missingNotices: [], reason: "no_contract_brain_notices_required" };
  }
  const acked = await listAcknowledgedNoticeKeys({
    contractId: params.contractId,
    userId: params.userId,
  });
  const missingNotices = required.filter((k) => !acked.has(k));
  if (missingNotices.length > 0) {
    return {
      canSign: false,
      missingNotices,
      reason: "contract_brain_notices_not_acknowledged",
    };
  }
  return { canSign: true, missingNotices: [], reason: "contract_brain_ok" };
}

export function contractBrainGateKeyForUser(userId: string): string {
  return `lecipm_contract_brain:${userId}`;
}

export async function persistSignatureGateCheck(params: {
  contractId: string;
  userId: string;
  result: SignatureGateResult;
}): Promise<void> {
  const gateKey = contractBrainGateKeyForUser(params.userId);
  await prisma.contractSignatureGate.upsert({
    where: {
      contractId_gateKey: { contractId: params.contractId, gateKey },
    },
    create: {
      contractId: params.contractId,
      userId: params.userId,
      gateKey,
      passed: params.result.canSign,
      passedAt: params.result.canSign ? new Date() : null,
      reason: params.result.reason,
    },
    update: {
      userId: params.userId,
      passed: params.result.canSign,
      passedAt: params.result.canSign ? new Date() : null,
      reason: params.result.reason,
    },
  });
}

export async function acknowledgeContractBrainNotice(params: {
  contractId: string;
  userId: string;
  noticeKey: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const def = getContractBrainNoticeDefinition(params.noticeKey);
  if (!def) return { ok: false, error: "Unknown noticeKey" };

  const snapshot = formatNoticeSnapshotBody(def);

  const existing = await prisma.contractLegalNotice.findFirst({
    where: {
      contractId: params.contractId,
      userId: params.userId,
      noticeKey: def.key,
      version: def.version,
    },
  });

  if (existing?.acceptedAt) {
    logContractBrain("notice_acknowledged_idempotent", {
      contractId: params.contractId,
      userId: params.userId,
      noticeKey: def.key,
      version: def.version,
    });
    return { ok: true };
  }

  if (existing && !existing.acceptedAt) {
    await prisma.contractLegalNotice.update({
      where: { id: existing.id },
      data: {
        acceptedAt: new Date(),
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
        contentSnapshot: snapshot,
        title: def.title,
      },
    });
  } else {
    await prisma.contractLegalNotice.create({
      data: {
        contractId: params.contractId,
        userId: params.userId,
        noticeKey: def.key,
        version: def.version,
        title: def.title,
        contentSnapshot: snapshot,
        acceptedAt: new Date(),
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    });
  }

  logContractBrain("notice_acknowledged", {
    contractId: params.contractId,
    userId: params.userId,
    noticeKey: def.key,
    version: def.version,
  });

  return { ok: true };
}

export async function assertContractBrainAllowsSigning(params: {
  contractId: string;
  userId: string;
  contractContent: unknown;
}): Promise<{ ok: true } | { ok: false; error: string; missingNotices: string[] }> {
  const gate = await evaluateContractBrainSignatureGate({
    contractId: params.contractId,
    userId: params.userId,
    contractContent: params.contractContent,
  });
  if (!gate.canSign) {
    logContractBrain("signature_blocked", {
      contractId: params.contractId,
      userId: params.userId,
      missingNotices: gate.missingNotices,
      reason: gate.reason,
    });
    return {
      ok: false,
      error: "CONTRACT_BRAIN_NOTICE_REQUIRED",
      missingNotices: gate.missingNotices,
    };
  }
  logContractBrain("signature_allowed", {
    contractId: params.contractId,
    userId: params.userId,
  });
  return { ok: true };
}
