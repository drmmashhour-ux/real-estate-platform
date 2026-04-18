import type { AutopilotMode, PlatformAutopilotRiskClass } from "@prisma/client";
import { requiresApproval } from "../policies/autopilot-safety-check.service";
import { modeAllowsPreparedExecution, modeAllowsSafeAuto } from "../policies/autopilot-mode.service";

export function canExecuteWithoutHumanApproval(opts: {
  mode: AutopilotMode;
  risk: PlatformAutopilotRiskClass;
}): boolean {
  if (opts.risk === "HIGH" || opts.risk === "CRITICAL") return false;
  if (requiresApproval(opts.risk) && opts.mode === "ASSIST") return false;
  if (opts.risk === "LOW" && modeAllowsSafeAuto(opts.mode)) return true;
  if (opts.risk === "MEDIUM") return false;
  return modeAllowsPreparedExecution(opts.mode) && opts.risk === "LOW";
}
