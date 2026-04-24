import { crmLearningLog } from "@/modules/playbook-memory/playbook-learning-logger";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";

export type CrossDomainGate = { allowed: boolean; rationale: string };

/**
 * Strict allowlist for cross-domain *observability* (log-only hints).
 * Does not execute playbooks or mutate external systems.
 * Never throws.
 */
export function evaluateCrossDomainTransfer(fromDomain: string, toDomain: string): CrossDomainGate {
  try {
    const f = String(fromDomain ?? "").trim().toUpperCase();
    const t = String(toDomain ?? "").trim().toUpperCase();
    if (f === "DREAM_HOME" && t === "LISTINGS") {
      return {
        allowed: true,
        rationale:
          "Allowlisted: Dream Home context may inform listing discovery; bridge is observability-only (no automatic listing mutations).",
      };
    }
    if (f === "LEADS" && t === "GROWTH") {
      const enabled =
        process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH === "1" ||
        process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH === "true";
      if (enabled) {
        return {
          allowed: true,
          rationale:
            "LEADS→GROWTH approved via PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH; log-only hints, no outbound automation.",
        };
      }
      return {
        allowed: false,
        rationale:
          "LEADS→GROWTH blocked by default. Set PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH=true for approved log-only observability.",
      };
    }
    return { allowed: false, rationale: `Transfer ${f}→${t} is not on the allowlist.` };
  } catch {
    return { allowed: false, rationale: "cross_domain_evaluation_failed_safe_default_block" };
  }
}

/** CRM inquiry hook: LEADS→GROWTH gating + structured logs only. Never throws. */
export function logCrossDomainCrmToGrowthSafe(leadId: string): void {
  try {
    const gate = evaluateCrossDomainTransfer("LEADS", "GROWTH");
    const payload = { leadId, allowed: gate.allowed, rationale: gate.rationale };
    crmLearningLog.info("cross_domain_leads_growth", payload);
    playbookLog.info("cross_domain_policy", { ...payload, from: "LEADS", to: "GROWTH" });
  } catch (e) {
    try {
      crmLearningLog.warn("cross_domain_leads_growth_failed", {
        leadId,
        message: e instanceof Error ? e.message : String(e),
      });
    } catch {
      /* */
    }
  }
}
