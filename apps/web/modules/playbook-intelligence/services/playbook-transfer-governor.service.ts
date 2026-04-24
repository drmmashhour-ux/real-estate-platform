import type { MemoryDomain } from "@prisma/client";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { computeCrossDomainCompatibility, computeTransferPenalty } from "../utils/playbook-transfer-score";
import type { TransferEligibilityResult } from "../shared/shared-context.types";

/**
 * Gated cross-domain transfer. No protected-trait logic; policy is domain-pair only.
 * Never throws.
 */
export function evaluateTransferEligibility(params: { source: MemoryDomain; target: MemoryDomain }): TransferEligibilityResult {
  try {
    const { source, target } = params;
    if (String(source) === String(target)) {
      return { allowed: true, blockedReasons: [], transferPenalty: 0, compatibilityScore: 1 };
    }
    const compatibilityScore = computeCrossDomainCompatibility(source, target);
    const transferPenalty = computeTransferPenalty(source, target);
    if (compatibilityScore <= 0) {
      return {
        allowed: false,
        blockedReasons: ["cross_domain_pair_not_approved"],
        transferPenalty: 0.4,
        compatibilityScore: 0,
      };
    }
    if (compatibilityScore < 0.32) {
      return {
        allowed: false,
        blockedReasons: ["transfer_compatibility_too_low"],
        transferPenalty,
        compatibilityScore,
      };
    }
    return { allowed: true, blockedReasons: [], transferPenalty, compatibilityScore };
  } catch (e) {
    playbookLog.warn("evaluateTransferEligibility", { message: e instanceof Error ? e.message : String(e) });
    return { allowed: false, blockedReasons: ["governor_error"], transferPenalty: 0, compatibilityScore: 0 };
  }
}
