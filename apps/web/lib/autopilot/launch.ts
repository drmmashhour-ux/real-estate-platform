import { prisma } from "@repo/db";

export async function launchAutopilotRecommendationWorkflow(recommendationId: string) {
  const rec = await prisma.portfolioAutopilotRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!rec) throw new Error("RECOMMENDATION_NOT_FOUND");

  let workflowType = "compare_deals";
  let steps: any[] = [];

  if (rec.recommendationType === "buy_more") {
    workflowType = "buy_box_create";
    steps = [
      {
        type: "buy_box_create",
        label: "Create expansion buy box near strong asset",
        input: {
          city: null,
          strategyType: "growth",
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

  // Ensure steps is at least an empty array for JSON field
  const safeSteps = steps.length > 0 ? steps : [];

  const workflow = await prisma.aIWorkflow.create({
    data: {
      ownerType: "solo_broker",
      ownerId: "me",
      type: workflowType,
      status: "proposed",
      title: rec.title,
      description: rec.description ?? undefined,
      requiresApproval: true,
      steps: safeSteps,
    },
  });

  // Audit: Workflow launched from recommendation
  await prisma.auditLog.create({
    data: {
      action: "PORTFOLIO_WORKFLOW_LAUNCHED",
      entityType: "AIWorkflow",
      entityId: workflow.id,
      metadata: { recommendationId, workflowType },
    },
  });

  return workflow;
}
