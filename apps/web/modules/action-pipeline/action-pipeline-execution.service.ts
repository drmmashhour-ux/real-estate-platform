import type { ActionPipelineType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";

/**
 * Side-effects after broker signature — extend per type (send offer, persist contract, invoice, etc.).
 * Must only run after status is SIGNED (caller sets EXECUTED after this returns).
 */
const EXECUTION_HOOKS_BY_TYPE: Record<ActionPipelineType, string[]> = {
  DEAL: ["finalize_deal_step", "notify_pipeline_stakeholders"],
  DOCUMENT: ["persist_contract_revision", "attach_to_deal_room"],
  INVESTMENT: ["record_investor_allocations", "sync_capital_ledger"],
  CLOSING: ["prepare_closing_package_export", "advance_sd_closing_timeline"],
  FINANCE: ["finalize_invoice_record", "sync_finance_audit"],
};

export async function runActionPipelineExecutionHooks(input: {
  actionId: string;
  type: ActionPipelineType;
  dealId: string | null;
  dataJson: unknown;
}): Promise<{ hooksRun: string[] }> {
  const hooksRun = EXECUTION_HOOKS_BY_TYPE[input.type];

  if (input.dealId) {
    await prisma.dealExecutionAuditLog
      .create({
        data: {
          dealId: input.dealId,
          actorUserId: null,
          actionKey: "autopilot_action_pipeline_hook",
          payload: asInputJsonValue({
            actionPipelineId: input.actionId,
            type: input.type,
            hooksRun,
            dataPreview:
              input.dataJson !== null && typeof input.dataJson === "object"
                ? Object.keys(input.dataJson as object).slice(0, 12)
                : typeof input.dataJson,
          }),
        },
      })
      .catch(() => undefined);
  }

  return { hooksRun };
}
