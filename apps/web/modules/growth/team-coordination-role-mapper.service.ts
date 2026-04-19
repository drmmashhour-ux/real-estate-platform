/**
 * Deterministic default role hints — explicit assignment overrides this in coordination UI.
 */

import type { CoordinationRole } from "@/modules/growth/team-coordination.types";
import type { ExecutionTask } from "@/modules/growth/execution-planner.types";

export type RoleMappingResult = {
  role: CoordinationRole;
  rationale: string;
};

export function suggestDefaultRole(task: ExecutionTask): RoleMappingResult {
  const title = `${task.title} ${task.description}`.toLowerCase();

  if (task.source === "allocation" && task.category === "scaling") {
    return {
      role: "growth_owner",
      rationale: "Portfolio-scale emphasis from allocation engine maps to growth owner oversight.",
    };
  }

  if (task.source === "allocation" && (task.category === "broker" || task.category === "sourcing")) {
    return {
      role: "broker_ops_owner",
      rationale: "Broker/supply posture from allocation — broker ops coordinates CRM + roster follow-through.",
    };
  }

  if (
    task.category === "broker" ||
    title.includes("broker") ||
    title.includes("routing") ||
    task.source === "ai_assist"
  ) {
    if (title.includes("pricing") || title.includes("monetiz") || task.category === "revenue") {
      return {
        role: "revenue_owner",
        rationale: "Monetization or pricing posture review — revenue owner validates commercial guardrails.",
      };
    }
    return {
      role: "broker_ops_owner",
      rationale: "Broker routing / bench signals default to broker ops ownership.",
    };
  }

  if (
    task.targetKind === "city" ||
    task.source === "domination_plan" ||
    title.includes("city") ||
    title.includes("domination")
  ) {
    return {
      role: "city_owner",
      rationale: "City-scoped playbook — city owner aligns field execution.",
    };
  }

  if (task.category === "revenue" || title.includes("revenue") || title.includes("monetiz")) {
    return {
      role: "revenue_owner",
      rationale: "Revenue/monetization surface — revenue owner validates before operational scaling.",
    };
  }

  if (
    task.category === "bnhub" ||
    title.includes("bnb") ||
    title.includes("host") ||
    title.includes("stay")
  ) {
    return {
      role: "growth_owner",
      rationale: "BNBHUB/host lens typically sits with cross-market growth oversight.",
    };
  }

  if (
    task.source === "flywheel" ||
    task.source === "mission_control" ||
    title.includes("governance") ||
    title.includes("policy") ||
    task.category === "ops"
  ) {
    return {
      role: "growth_owner",
      rationale: "Mission control / flywheel / governance-adjacent review defaults to growth owner orchestration.",
    };
  }

  if (task.actionType === "inspect" || task.actionType === "review") {
    return {
      role: "admin",
      rationale: "Inspection / verification steps often touch admin gates or dashboards first.",
    };
  }

  return {
    role: "operator",
    rationale: "General execution + logging follow-through defaults to operators unless a narrower owner applies.",
  };
}
