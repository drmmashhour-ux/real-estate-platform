import OpenAI from "openai";

/**
 * OpenAI client for the `lib/ai` assistant module.
 * Uses the same env var as the rest of the app; requests fail at runtime if unset.
 */
export const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
