import { groundedComposeWithResponsesApi } from "@/modules/ai-training/infrastructure/openaiGroundedGenerationService";

export async function assembleGroundedAnswer(input: {
  query: string;
  deterministicToolPayload: Record<string, unknown>;
  retrievedContext: Array<{ memoryType: string; content: string }>;
}): Promise<{ summary: string; grounded: boolean }> {
  const fallback = buildDeterministicSummary(input.query, input.deterministicToolPayload, input.retrievedContext);
  const llm = await groundedComposeWithResponsesApi({
    instruction: "Compose a concise grounded answer with explicit caveats when data is missing.",
    query: input.query,
    deterministicPayload: input.deterministicToolPayload,
    retrievedContext: input.retrievedContext,
  });
  return { summary: llm ?? fallback, grounded: true };
}

function buildDeterministicSummary(
  query: string,
  payload: Record<string, unknown>,
  context: Array<{ memoryType: string; content: string }>
) {
  const snippets = context.slice(0, 3).map((c) => c.content.slice(0, 100));
  return [
    `Question: ${query}`,
    `Deterministic data: ${JSON.stringify(payload).slice(0, 500)}`,
    snippets.length ? `Context: ${snippets.join(" | ")}` : "Context: none",
    "Output is grounded in platform data only.",
  ].join("\n");
}
