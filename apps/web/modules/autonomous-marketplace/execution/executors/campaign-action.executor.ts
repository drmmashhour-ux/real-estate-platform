import type { ExecutionResult } from "../../types/domain.types";
import type { ProposedAction } from "../../types/domain.types";
import { autonomyLog } from "../../internal/autonomy-log";

export async function executeCampaignAction(
  action: ProposedAction,
  opts: { dryRun: boolean; allowExecute: boolean },
): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();

  if (opts.dryRun || !opts.allowExecute) {
    return {
      status: "DRY_RUN",
      startedAt,
      finishedAt: new Date().toISOString(),
      detail: "Campaign action simulated — no Ads Manager or spend API calls.",
      metadata: { campaignKey: action.target.id },
    };
  }

  if (action.type === "SCALE_CAMPAIGN_BUDGET") {
    autonomyLog.execution("scale campaign advisory only", { campaignKey: action.target.id });
    return {
      status: "EXECUTED",
      startedAt,
      finishedAt: new Date().toISOString(),
      detail: "Budget scale recorded as recommendation — apply manually in Ads Manager.",
      metadata: { advisory: true },
    };
  }

  return {
    status: "SKIPPED",
    startedAt,
    finishedAt: new Date().toISOString(),
    detail: "Unsupported campaign action",
    metadata: { type: action.type },
  };
}
