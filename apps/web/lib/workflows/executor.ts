import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { addToWatchlist } from "@/src/modules/watchlist-alerts/application/addToWatchlist";
import { assertDraftContractConfirmed, assertRegulatedWorkflowApprovedForExecution } from "@/lib/workflows/safety";

export type ExecuteWorkflowOptions = {
  regulatedConfirmed?: boolean;
};

type Step = { type: string; label?: string; input?: Record<string, unknown> };

function parseSteps(raw: unknown): Step[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s, i) => {
    const o = s as Record<string, unknown>;
    return {
      type: typeof o.type === "string" ? o.type : `step_${i}`,
      label: typeof o.label === "string" ? o.label : undefined,
      input: o.input && typeof o.input === "object" && !Array.isArray(o.input) ? (o.input as Record<string, unknown>) : {},
    };
  });
}

async function runStep(
  step: Step,
  ownerId: string
): Promise<Record<string, unknown>> {
  const input = step.input ?? {};

  switch (step.type) {
    case "watchlist_add": {
      const listingId = typeof input.listingId === "string" ? input.listingId : "";
      if (!isReasonableListingId(listingId)) {
        throw new Error("WATCHLIST_LISTING_ID_REQUIRED");
      }
      const out = await addToWatchlist({ userId: ownerId, listingId });
      return { watchlist: out };
    }
    case "saved_search_create": {
      const name = typeof input.name === "string" ? input.name : "Saved search";
      const mode = typeof input.mode === "string" ? input.mode : "buy";
      const filtersJson =
        input.filtersJson && typeof input.filtersJson === "object" && !Array.isArray(input.filtersJson)
          ? (input.filtersJson as Prisma.InputJsonValue)
          : ({} as Prisma.InputJsonValue);
      const row = await prisma.savedSearch.create({
        data: {
          userId: ownerId,
          name,
          mode,
          filtersJson,
        },
      });
      return { savedSearchId: row.id };
    }
    case "compare_deals": {
      const region = typeof input.regionHint === "string" ? input.regionHint : undefined;
      return {
        deferred: false,
        href: "/compare",
        note: region ? `Open compare workspace (hint: ${region}).` : "Open compare workspace.",
      };
    }
    case "buy_box_create": {
      return {
        deferred: true,
        href: "/dashboard/broker/buy-box",
        note: "Buy box criteria are configured in the dashboard after you approve this plan.",
      };
    }
    case "appraisal_run": {
      return {
        deferred: true,
        note: "Appraisal execution is not automated here — use your licensed appraiser or internal queue.",
      };
    }
    case "draft_contract": {
      return {
        deferred: true,
        advisoryOnly: true,
        note: "No automated contract generation. Engage counsel for binding documents.",
      };
    }
    case "alert_analysis": {
      return {
        deferred: true,
        note: "Alert analysis step recorded; deep analysis runs in the alerts workspace.",
      };
    }
    default:
      return { note: `Unknown step type "${step.type}" — skipped.`, skipped: true };
  }
}

export async function executeWorkflow(workflowId: string, opts?: ExecuteWorkflowOptions): Promise<void> {
  const wf = await prisma.aIWorkflow.findUnique({
    where: { id: workflowId },
  });

  if (!wf) throw new Error("WORKFLOW_NOT_FOUND");

  if (wf.status === "completed") throw new Error("WORKFLOW_ALREADY_COMPLETED");
  if (wf.status === "failed") throw new Error("WORKFLOW_FAILED_PREVIOUSLY");
  if (wf.status === "executing") throw new Error("WORKFLOW_ALREADY_EXECUTING");

  const steps = parseSteps(wf.steps);
  assertRegulatedWorkflowApprovedForExecution(wf.type, wf.status);
  assertDraftContractConfirmed(wf.type, steps, opts?.regulatedConfirmed);

  const needApproval = wf.requiresApproval;
  if (needApproval && wf.status !== "approved") {
    throw new Error("APPROVAL_REQUIRED");
  }
  if (!needApproval && wf.status !== "proposed" && wf.status !== "approved") {
    throw new Error("INVALID_WORKFLOW_STATUS");
  }

  await prisma.aIWorkflow.update({
    where: { id: workflowId },
    data: { status: "executing" },
  });

  const stepResults: { stepIndex: number; type: string; ok: boolean; summary?: string }[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    try {
      const output = await runStep(step, wf.ownerId);
      stepResults.push({ stepIndex: i, type: step.type, ok: true, summary: step.label });
      await prisma.aIWorkflowExecutionLog.create({
        data: {
          workflowId,
          stepIndex: i,
          stepType: step.type,
          status: "success",
          input: step.input as Prisma.InputJsonValue | undefined,
          output: output as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await prisma.aIWorkflowExecutionLog.create({
        data: {
          workflowId,
          stepIndex: i,
          stepType: step.type,
          status: "failed",
          input: step.input as Prisma.InputJsonValue | undefined,
          output: { error: message } as Prisma.InputJsonValue,
        },
      });
      await prisma.aIWorkflow.update({
        where: { id: workflowId },
        data: { status: "failed", result: { stepResults, failedAt: i } as Prisma.InputJsonValue },
      });
      throw e;
    }
  }

  await prisma.aIWorkflow.update({
    where: { id: workflowId },
    data: {
      status: "completed",
      result: { stepResults, finishedAt: new Date().toISOString() } as Prisma.InputJsonValue,
    },
  });
}
