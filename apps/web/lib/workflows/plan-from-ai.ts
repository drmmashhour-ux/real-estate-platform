import { buildWorkflowPrompt } from "@/lib/ai/workflow";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { mergeRequiresApproval, assertNoAutoExecutionInPlanJson, WorkflowSafetyError } from "@/lib/workflows/safety";
import type { WorkflowPlanPayload, WorkflowStep } from "@/lib/workflows/types";

const MODEL = process.env.WORKFLOW_PLANNER_AI_MODEL?.trim() || "gpt-4o-mini";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parsePlan(raw: string): WorkflowPlanPayload {
  assertNoAutoExecutionInPlanJson(raw);
  const cleaned = stripJsonFences(raw);
  assertNoAutoExecutionInPlanJson(cleaned);
  const p = JSON.parse(cleaned) as Record<string, unknown>;
  const stepsRaw = Array.isArray(p.steps) ? p.steps : [];
  const steps: WorkflowStep[] = stepsRaw.map((s, i) => {
    const o = s as Record<string, unknown>;
    return {
      type: typeof o.type === "string" ? o.type : `step_${i}`,
      label: typeof o.label === "string" ? o.label : `Step ${i + 1}`,
      input:
        o.input && typeof o.input === "object" && !Array.isArray(o.input)
          ? (o.input as Record<string, unknown>)
          : {},
    };
  });
  const workflowType = typeof p.type === "string" ? p.type : "compare_deals";
  const aiRequires = typeof p.requiresApproval === "boolean" ? p.requiresApproval : true;
  return {
    type: workflowType,
    title: typeof p.title === "string" ? p.title : "Workflow",
    description: typeof p.description === "string" ? p.description : "",
    requiresApproval: mergeRequiresApproval(workflowType, aiRequires),
    steps,
  };
}

function fallbackPlan(message: string): WorkflowPlanPayload {
  const lower = message.toLowerCase();
  if (lower.includes("watchlist")) {
    return {
      type: "watchlist_add",
      title: "Add to watchlist",
      description: "Confirm the listing to track, then run once approved.",
      requiresApproval: mergeRequiresApproval("watchlist_add", false),
      steps: [
        {
          type: "watchlist_add",
          label: "Add listing to your watchlist",
          input: {},
        },
      ],
    };
  }
  if (lower.includes("buy box") || lower.includes("buybox")) {
    return {
      type: "buy_box_create",
      title: "Create buy box",
      description: "Define criteria for cashflow or growth — advisory planning only.",
      requiresApproval: mergeRequiresApproval("buy_box_create", true),
      steps: [
        {
          type: "buy_box_create",
          label: "Open buy box builder",
          input: { hint: "Use dashboard buy box after approval." },
        },
      ],
    };
  }
  if (lower.includes("compare") && lower.includes("deal")) {
    return {
      type: "compare_deals",
      title: "Compare deals",
      description: "Side-by-side comparison — deterministic data only.",
      requiresApproval: mergeRequiresApproval("compare_deals", false),
      steps: [
        {
          type: "compare_deals",
          label: "Open compare workspace",
          input: { regionHint: "Laval" },
        },
      ],
    };
  }
  return {
    type: "compare_deals",
    title: "Assisted workflow",
    description: "Review the suggested steps and approve before any action runs.",
    requiresApproval: mergeRequiresApproval("compare_deals", true),
    steps: [
      {
        type: "compare_deals",
        label: "Review opportunities",
        input: {},
      },
    ],
  };
}

export async function generateWorkflowPlanFromMessage(
  userMessage: string,
  context: unknown
): Promise<WorkflowPlanPayload> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return fallbackPlan(userMessage);
  }

  const prompt = buildWorkflowPrompt({ userMessage, context });
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.25,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON for workflow planning. Never schedule autonomous regulated execution.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) return fallbackPlan(userMessage);
  try {
    return parsePlan(raw);
  } catch (e) {
    if ((e as WorkflowSafetyError)?.code === "AUTO_EXECUTION_FORBIDDEN") {
      throw e;
    }
    return fallbackPlan(userMessage);
  }
}
