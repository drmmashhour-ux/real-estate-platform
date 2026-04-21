import type { ExecutiveTrigger } from "./executive.types";
import { executiveLog } from "./executive-log";

export type AgentKey =
  | "ACQUISITION"
  | "ESG"
  | "LEGAL_COMPLIANCE"
  | "FINANCING"
  | "COMMITTEE"
  | "CLOSING"
  | "ASSET_OPERATIONS"
  | "PORTFOLIO"
  | "INVESTOR_REPORTING"
  | "GROWTH";

/**
 * Trigger → agents to invoke (deterministic routing). Orchestrator filters by entity availability.
 */
export function resolveAgentsForTrigger(trigger: ExecutiveTrigger): AgentKey[] {
  const matrix: Record<ExecutiveTrigger, AgentKey[]> = {
    DEAL_CREATED: ["ACQUISITION", "ESG", "LEGAL_COMPLIANCE"],
    DEAL_STAGE_CHANGED: ["ACQUISITION", "FINANCING", "COMMITTEE", "INVESTOR_REPORTING"],
    MEMO_GENERATED: ["COMMITTEE", "INVESTOR_REPORTING"],
    IC_PACK_GENERATED: ["COMMITTEE", "INVESTOR_REPORTING"],
    COMMITTEE_DECISION_RECORDED: ["COMMITTEE", "LEGAL_COMPLIANCE"],
    ESG_SCORE_CHANGED: ["ESG", "PORTFOLIO"],
    EVIDENCE_UPLOADED: ["ESG", "LEGAL_COMPLIANCE"],
    ACQUISITION_STATUS_CHANGED: ["ACQUISITION", "FINANCING"],
    LENDER_CONDITION_CHANGED: ["FINANCING", "LEGAL_COMPLIANCE"],
    COVENANT_RISK_CHANGED: ["FINANCING", "PORTFOLIO", "LEGAL_COMPLIANCE"],
    CLOSING_READINESS_CHANGED: ["CLOSING", "FINANCING"],
    ASSET_HEALTH_DECLINED: ["ASSET_OPERATIONS", "PORTFOLIO", "ESG"],
    PORTFOLIO_RUN_REQUESTED: ["PORTFOLIO", "GROWTH"],
    MANUAL_EXECUTE: ["ACQUISITION", "ESG", "LEGAL_COMPLIANCE", "FINANCING", "COMMITTEE", "CLOSING", "ASSET_OPERATIONS", "PORTFOLIO", "INVESTOR_REPORTING", "GROWTH"],
  };
  const list = matrix[trigger] ?? matrix.MANUAL_EXECUTE;
  executiveLog.router("resolved", { trigger, count: list.length });
  return list;
}

/** Which agents can run for entity type without extra linkage. */
export function filterAgentsForEntity(entityType: string, agents: AgentKey[]): AgentKey[] {
  return agents.filter((a) => {
    if (a === "CLOSING") return entityType === "DEAL";
    if (a === "PORTFOLIO") return entityType === "PORTFOLIO" || entityType === "ASSET";
    if (a === "ASSET_OPERATIONS") return entityType === "ASSET";
    if (a === "COMMITTEE" || a === "INVESTOR_REPORTING") return entityType === "PIPELINE_DEAL";
    if (a === "GROWTH") return entityType === "PIPELINE_DEAL" || entityType === "LISTING";
    if (a === "ESG") return entityType === "ASSET";
    if (a === "ACQUISITION") return entityType === "PIPELINE_DEAL" || entityType === "DEAL";
    return true;
  });
}
