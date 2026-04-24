import {
  CONTRACT_BRAIN_NOTICE_DEFINITIONS,
  LIMITED_ROLE_NOTICE_KEY,
  type ContractBrainNoticeKey,
} from "@/lib/legal/contract-brain-notices";
import type { ContractBrainContentMeta } from "@/lib/legal/contract-brain-types";
import type { Prisma } from "@prisma/client";

export function getContractBrainMetaFromContent(content: unknown): ContractBrainContentMeta {
  if (!content || typeof content !== "object") return { requiredNoticeKeys: [] };
  const root = content as Record<string, unknown>;
  const raw = root.contractBrain;
  if (!raw || typeof raw !== "object") return { requiredNoticeKeys: [] };
  const cb = raw as Record<string, unknown>;
  const keys = cb.requiredNoticeKeys;
  if (!Array.isArray(keys)) return { requiredNoticeKeys: [] };
  const requiredNoticeKeys = keys.filter((k): k is string => typeof k === "string");
  const snapshotVersionByKey =
    cb.snapshotVersionByKey && typeof cb.snapshotVersionByKey === "object"
      ? (cb.snapshotVersionByKey as Record<string, string>)
      : undefined;
  return { requiredNoticeKeys, snapshotVersionByKey };
}

export function mergeContractBrainIntoPrismaContent(
  existing: Prisma.JsonValue | null | undefined,
  patch: ContractBrainContentMeta
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const prevBrain =
    base.contractBrain && typeof base.contractBrain === "object" && !Array.isArray(base.contractBrain)
      ? { ...(base.contractBrain as Record<string, unknown>) }
      : {};
  base.contractBrain = {
    ...prevBrain,
    requiredNoticeKeys: patch.requiredNoticeKeys,
    ...(patch.snapshotVersionByKey ? { snapshotVersionByKey: patch.snapshotVersionByKey } : {}),
  };
  return base as Prisma.InputJsonValue;
}

export function buildMetaForNoticeKeys(keys: ContractBrainNoticeKey[]): ContractBrainContentMeta {
  const snapshotVersionByKey: Record<string, string> = {};
  for (const k of keys) {
    snapshotVersionByKey[k] = CONTRACT_BRAIN_NOTICE_DEFINITIONS[k].version;
  }
  return { requiredNoticeKeys: [...keys], snapshotVersionByKey };
}

export function metaRequiresLimitedRoleNotice(meta: ContractBrainContentMeta): boolean {
  return meta.requiredNoticeKeys.includes(LIMITED_ROLE_NOTICE_KEY);
}
