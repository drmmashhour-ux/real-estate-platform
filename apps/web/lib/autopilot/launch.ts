import { prisma } from "@/lib/db";

/**
 * Create a proposed AI workflow from an accepted autopilot recommendation.
 * Does not execute trades, listings, or financing — `status` is always `proposed`.
 */
export async function launchAutopilotRecommendationWorkflow(
  recommendationId: string,
  ownerUserId: string,
  ownerType = "investor"
) {
  const rec = await prisma.portfolioAutopilotRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!rec) throw new Error("RECOMMENDATION_NOT_FOUND");

  let workflowType = "compare_deals";
  let steps: Array<Record<string, unknown>> = [];

  if (rec.recommendationType === "buy_more") {
    workflowType = "buy_box_create";
    steps = [
      {
        type: "buy_box_create",
        label: "Create expansion buy box near strong asset",
        input: {
          city: null,
          strategyType: "growth",
          propertyId: rec.propertyId,
          neighborhoodKey: rec.neighborhoodKey,
        },
      },
    ];
  }

  if (rec.recommendationType === "sell_review") {
    workflowType = "compare_deals";
    steps = [
      {
        type: "compare_deals",
        label: "Compare weak asset against better opportunities",
        input: {
          propertyId: rec.propertyId,
        },
      },
    ];
  }

  if (rec.recommendationType === "refinance_review") {
    workflowType = "refinance_review";
    steps = [
      {
        type: "refinance_review",
        label: "Review financing structure (advisory)",
        input: { propertyId: rec.propertyId },
      },
    ];
  }

  const safeSteps = steps.length > 0 ? steps : [];

  const workflow = await prisma.aIWorkflow.create({
    data: {
      ownerType,
      ownerId: ownerUserId,
      type: workflowType,
      status: "proposed",
      title: rec.title,
      description: rec.description ?? undefined,
      requiresApproval: true,
      steps: safeSteps,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ownerUserId,
      action: "PORTFOLIO_AUTOPILOT_WORKFLOW_LAUNCHED",
      entityType: "AIWorkflow",
      entityId: workflow.id,
      metadata: { recommendationId, workflowType } as object,
    },
  });

  return workflow;
}
