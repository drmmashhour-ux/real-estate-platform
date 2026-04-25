import OpenAI from "openai";

const apiKeyRaw = process.env.OPENAI_API_KEY?.trim();
const apiKey =
  apiKeyRaw && apiKeyRaw !== "your_key_here" ? apiKeyRaw : undefined;

if (!apiKey) {
  console.warn("OPENAI_API_KEY missing — skipping OpenAI init");
}

export const openai: OpenAI | null = apiKey ? new OpenAI({ apiKey }) : null;

export function isOpenAiConfigured(): boolean {
  return Boolean(apiKey);
}
