import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isReasonableListingId } from "@/lib/api/safe-params";
import type { WorkflowPlanPayload } from "@/lib/workflows/types";

export async function createWorkflowFromPlan(
  plan: WorkflowPlanPayload,
  ownerType: string,
  ownerId: string
) {
  return prisma.aIWorkflow.create({
    data: {
      ownerType,
      ownerId,
      type: plan.type,
      status: "proposed",
      title: plan.title,
      description: plan.description ? plan.description : null,
      requiresApproval: plan.requiresApproval,
      steps: plan.steps as unknown as Prisma.InputJsonValue,
    },
  });
}

export function enrichPlanWithRequestContext(
  plan: WorkflowPlanPayload,
  ctx: { listingId?: string | null }
): WorkflowPlanPayload {
  if (!ctx.listingId || !isReasonableListingId(ctx.listingId)) return plan;
  return {
    ...plan,
    steps: plan.steps.map((s) => {
      if (s.type !== "watchlist_add") return s;
      const base =
        s.input && typeof s.input === "object" && !Array.isArray(s.input)
          ? { ...s.input }
          : {};
      const existing = typeof base.listingId === "string" ? base.listingId : "";
      const listingId =
        existing && isReasonableListingId(existing) ? existing : ctx.listingId;
      return { ...s, input: { ...base, listingId } };
    }),
  };
}
