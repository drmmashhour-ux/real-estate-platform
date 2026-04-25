import { prisma } from "@/lib/db";
import type { OutcomeType } from "./feedback-score";

export const HOST_PROFILE_WEIGHT_MIN = 0.5;
export const HOST_PROFILE_WEIGHT_MAX = 1.5;
export const HOST_PROFILE_SENSITIVITY_MIN = 0;
export const HOST_PROFILE_SENSITIVITY_MAX = 1;
const WEIGHT_STEP = 0.03;
const TEMPLATE_STEP = 0.03;
const IGNORE_SENSITIVITY_STEP = 0.04;

export type HostPreferenceProfileData = {
  preferredRuleWeights: Record<string, number>;
  preferredTemplateKeys: Record<string, Record<string, number>>;
  rejectionPatterns: {
    ignoreCount: number;
    perRule: Record<string, { approvals: number; rejections: number; ignores: number }>;
  };
  notificationSensitivity: number;
};

export function defaultHostPreferenceData(): HostPreferenceProfileData {
  return {
    preferredRuleWeights: {},
    preferredTemplateKeys: {},
    rejectionPatterns: { ignoreCount: 0, perRule: {} },
    notificationSensitivity: 0.5,
  };
}

function clampWeight(n: number): number {
  return Math.min(HOST_PROFILE_WEIGHT_MAX, Math.max(HOST_PROFILE_WEIGHT_MIN, n));
}

function clampSensitivity(n: number): number {
  return Math.min(HOST_PROFILE_SENSITIVITY_MAX, Math.max(HOST_PROFILE_SENSITIVITY_MIN, n));
}

function parseProfileJson(raw: unknown): HostPreferenceProfileData {
  const base = defaultHostPreferenceData();
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  if (o.preferredRuleWeights && typeof o.preferredRuleWeights === "object" && !Array.isArray(o.preferredRuleWeights)) {
    base.preferredRuleWeights = { ...(o.preferredRuleWeights as Record<string, number>) };
  }
  if (
    o.preferredTemplateKeys &&
    typeof o.preferredTemplateKeys === "object" &&
    !Array.isArray(o.preferredTemplateKeys)
  ) {
    const tk = o.preferredTemplateKeys as Record<string, Record<string, number>>;
    for (const [rk, rv] of Object.entries(tk)) {
      if (rv && typeof rv === "object" && !Array.isArray(rv)) {
        base.preferredTemplateKeys[rk] = { ...rv };
      }
    }
  }
  if (o.rejectionPatterns && typeof o.rejectionPatterns === "object" && !Array.isArray(o.rejectionPatterns)) {
    const rp = o.rejectionPatterns as Record<string, unknown>;
    if (typeof rp.ignoreCount === "number") base.rejectionPatterns.ignoreCount = rp.ignoreCount;
    if (rp.perRule && typeof rp.perRule === "object" && !Array.isArray(rp.perRule)) {
      base.rejectionPatterns.perRule = { ...(rp.perRule as Record<string, { approvals: number; rejections: number; ignores: number }>) };
    }
  }
  if (typeof o.notificationSensitivity === "number" && Number.isFinite(o.notificationSensitivity)) {
    base.notificationSensitivity = clampSensitivity(o.notificationSensitivity);
  }
  return base;
}

function serializeProfileData(d: HostPreferenceProfileData): {
  preferredTemplateKeys: object;
  preferredRuleWeights: object;
  rejectionPatterns: object;
  notificationSensitivity: number;
} {
  return {
    preferredTemplateKeys: d.preferredTemplateKeys,
    preferredRuleWeights: d.preferredRuleWeights,
    rejectionPatterns: d.rejectionPatterns,
    notificationSensitivity: clampSensitivity(d.notificationSensitivity),
  };
}

/** Pure reducer for tests and transactional updates. */
export function applyOutcomeToHostPreferenceData(
  data: HostPreferenceProfileData,
  ruleName: string,
  templateKey: string | null,
  outcomeType: OutcomeType
): HostPreferenceProfileData {
  const next: HostPreferenceProfileData = {
    preferredRuleWeights: { ...data.preferredRuleWeights },
    preferredTemplateKeys: { ...data.preferredTemplateKeys },
    rejectionPatterns: {
      ignoreCount: data.rejectionPatterns.ignoreCount,
      perRule: { ...data.rejectionPatterns.perRule },
    },
    notificationSensitivity: data.notificationSensitivity,
  };

  const pr = next.rejectionPatterns.perRule[ruleName] ?? { approvals: 0, rejections: 0, ignores: 0 };
  next.rejectionPatterns.perRule[ruleName] = { ...pr };

  const success =
    outcomeType === "approved" || outcomeType === "applied" || outcomeType === "success";
  const failure =
    outcomeType === "rejected" || outcomeType === "reverted" || outcomeType === "failure";

  if (success) {
    const cur = next.preferredRuleWeights[ruleName] ?? 1;
    next.preferredRuleWeights[ruleName] = clampWeight(cur + WEIGHT_STEP);
    next.rejectionPatterns.perRule[ruleName].approvals += 1;
  } else if (failure) {
    const cur = next.preferredRuleWeights[ruleName] ?? 1;
    next.preferredRuleWeights[ruleName] = clampWeight(cur - WEIGHT_STEP);
    next.rejectionPatterns.perRule[ruleName].rejections += 1;
  } else if (outcomeType === "ignored") {
    next.rejectionPatterns.ignoreCount += 1;
    next.rejectionPatterns.perRule[ruleName] = {
      ...next.rejectionPatterns.perRule[ruleName],
      ignores: next.rejectionPatterns.perRule[ruleName].ignores + 1,
    };
    next.notificationSensitivity = clampSensitivity(next.notificationSensitivity + IGNORE_SENSITIVITY_STEP);
    const cur = next.preferredRuleWeights[ruleName] ?? 1;
    next.preferredRuleWeights[ruleName] = clampWeight(cur - WEIGHT_STEP / 2);
  }

  if (templateKey) {
    if (!next.preferredTemplateKeys[ruleName]) {
      next.preferredTemplateKeys[ruleName] = {};
    }
    const tkMap = { ...next.preferredTemplateKeys[ruleName] };
    const tCur = tkMap[templateKey] ?? 1;
    if (success) {
      tkMap[templateKey] = clampWeight(tCur + TEMPLATE_STEP);
    } else if (failure || outcomeType === "ignored") {
      tkMap[templateKey] = clampWeight(tCur - TEMPLATE_STEP);
    }
    next.preferredTemplateKeys[ruleName] = tkMap;
  }

  return next;
}

export async function getHostPreferenceProfile(hostId: string): Promise<{
  hostId: string;
  data: HostPreferenceProfileData;
  persisted: boolean;
  updatedAt: Date | null;
}> {
  const row = await prisma.aiHostPreferenceProfile.findUnique({
    where: { hostId },
  });
  if (!row) {
    return {
      hostId,
      data: defaultHostPreferenceData(),
      persisted: false,
      updatedAt: null,
    };
  }
  const data = parseProfileJson({
    preferredRuleWeights: row.preferredRuleWeights,
    preferredTemplateKeys: row.preferredTemplateKeys,
    rejectionPatterns: row.rejectionPatterns,
    notificationSensitivity: row.notificationSensitivity,
  });
  return {
    hostId,
    data,
    persisted: true,
    updatedAt: row.updatedAt,
  };
}

export async function updateHostPreferenceProfileFromOutcome(
  hostId: string,
  ruleName: string,
  templateKey: string | null,
  outcomeType: OutcomeType
): Promise<void> {
  if (!ruleName.startsWith("host_autopilot")) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.aiHostPreferenceProfile.findUnique({ where: { hostId } });
    const base = existing
      ? parseProfileJson({
          preferredRuleWeights: existing.preferredRuleWeights,
          preferredTemplateKeys: existing.preferredTemplateKeys,
          rejectionPatterns: existing.rejectionPatterns,
          notificationSensitivity: existing.notificationSensitivity,
        })
      : defaultHostPreferenceData();
    const merged = applyOutcomeToHostPreferenceData(base, ruleName, templateKey, outcomeType);
    const ser = serializeProfileData(merged);
    await tx.aiHostPreferenceProfile.upsert({
      where: { hostId },
      create: {
        hostId,
        ...ser,
      },
      update: ser,
    });
  });
}

export async function resetHostPreferenceProfile(hostId: string): Promise<void> {
  const fresh = serializeProfileData(defaultHostPreferenceData());
  await prisma.aiHostPreferenceProfile.upsert({
    where: { hostId },
    create: {
      hostId,
      ...fresh,
    },
    update: fresh,
  });
}

/** Multipliers for decision-engine personalization. */
export async function getHostDecisionMultipliers(
  hostId: string,
  ruleName: string
): Promise<{ ruleWeight: number; ignorePenaltyFactor: number; extraReasons: string[] }> {
  const row = await prisma.aiHostPreferenceProfile.findUnique({
    where: { hostId },
    select: { preferredRuleWeights: true, notificationSensitivity: true },
  });
  const reasons: string[] = [];
  if (!row) {
    return { ruleWeight: 1, ignorePenaltyFactor: 1, extraReasons: reasons };
  }
  const weights = parseProfileJson({
    preferredRuleWeights: row.preferredRuleWeights,
    preferredTemplateKeys: {},
    rejectionPatterns: {},
    notificationSensitivity: row.notificationSensitivity,
  });
  const rw = clampWeight(weights.preferredRuleWeights[ruleName] ?? 1);
  if (rw >= 1.06) reasons.push("host preference: receptive to this rule");
  if (rw <= 0.94) reasons.push("host preference: often declines this rule");
  const sens = clampSensitivity(row.notificationSensitivity);
  if (sens >= 0.72) reasons.push("host often ignores suggestions");
  const ignorePenaltyFactor = Math.max(0.55, 1 - 0.28 * sens);
  return { ruleWeight: rw, ignorePenaltyFactor, extraReasons: reasons };
}

/** Template host boosts for a rule (templateKey → multiplier). */
export async function getHostTemplateBoostsForRule(
  hostId: string,
  ruleName: string
): Promise<Record<string, number>> {
  const row = await prisma.aiHostPreferenceProfile.findUnique({
    where: { hostId },
    select: { preferredTemplateKeys: true },
  });
  if (!row) return {};
  const data = parseProfileJson({
    preferredRuleWeights: {},
    preferredTemplateKeys: row.preferredTemplateKeys,
    rejectionPatterns: {},
    notificationSensitivity: 0.5,
  });
  const m = data.preferredTemplateKeys[ruleName];
  if (!m || typeof m !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = clampWeight(v);
    }
  }
  return out;
}
