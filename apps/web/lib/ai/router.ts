import { askAI } from "./assistant";

export type AssistantChatInput = {
  prompt: string;
};

/**
 * Single entry for assistant traffic. Extend here (intent detection, tools, model pick)
 * without changing API routes or UI call sites.
 */
export async function routeAssistantChat(input: AssistantChatInput) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("prompt is required");
  }
  return askAI(prompt);
}
