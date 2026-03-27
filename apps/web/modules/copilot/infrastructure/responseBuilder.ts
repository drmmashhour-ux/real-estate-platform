import { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";
import type { CopilotResponse } from "@/modules/copilot/domain/copilotTypes";
import type { IntentActionDescriptor } from "@/modules/copilot/application/mapIntentToAction";
import { summarizeDeterministicCopilotPayload } from "@/modules/copilot/infrastructure/openaiResponsesClient";

/**
 * Build a minimal Copilot response from a skeleton action descriptor (orchestration / tests).
 * Production paths use deterministic engines inside {@link runCopilot} instead.
 */
export async function buildCopilotResponse(input: {
  query: string;
  intent: CopilotUserIntent | string;
  actionResult: IntentActionDescriptor;
}): Promise<CopilotResponse> {
  const intent = input.intent as CopilotUserIntent;
  const unknown = intent === CopilotUserIntent.UNKNOWN;
  return {
    intent,
    summary: input.actionResult.summary,
    actions: [],
    insights: [],
    warnings: unknown
      ? ["I need a clearer target, such as a property, portfolio, or listing goal."]
      : [],
    confidence: unknown ? "low" : "medium",
    data:
      input.actionResult.data !== null && input.actionResult.data !== undefined
        ? (input.actionResult.data as Record<string, unknown>)
        : { type: input.actionResult.type },
  };
}

/**
 * Optionally attach an LLM-generated summary string — never replaces trust/deal fields in `data`.
 */
export async function maybeEnrichResponseWithSummary(
  response: CopilotResponse,
  userQuery: string
): Promise<CopilotResponse> {
  const summaryExtra = await summarizeDeterministicCopilotPayload({
    userQuery,
    payload: {
      intent: response.intent,
      insights: response.insights,
      actions: response.actions.map((a) => ({ id: a.id, label: a.label, kind: a.kind })),
      dataKeys: response.data && typeof response.data === "object" ? Object.keys(response.data as object) : [],
    },
  });

  if (!summaryExtra) return response;

  return {
    ...response,
    summary: `${response.summary}\n\n${summaryExtra}`.trim(),
    data: {
      ...response.data,
      llmSummaryAppendix: summaryExtra,
    },
  };
}
