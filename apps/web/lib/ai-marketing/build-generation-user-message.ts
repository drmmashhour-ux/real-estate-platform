import { feedbackPromptBlock } from "./feedback-prompt";
import type { GenerationFeedbackInput } from "./types";

/**
 * Single builder for model "user" messages: JSON payload + optional feedback block.
 * Use across social, caption, email, and growth generators.
 */
export function buildGenerationUserMessage(
  base: Record<string, unknown>,
  feedback?: GenerationFeedbackInput
): string {
  return JSON.stringify(base) + feedbackPromptBlock(feedback);
}
