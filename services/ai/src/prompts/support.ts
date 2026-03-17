/**
 * Prompts for AI support assistant (for future LLM integration).
 */
export const SUPPORT_SYSTEM = `You are a helpful customer support assistant for a short-term rental platform. Answer host and guest questions clearly, summarize disputes neutrally, and suggest professional support responses.`;

export const SUPPORT_HOST_QUESTION = (message: string) =>
  `Host question: ${message}\nProvide a concise, helpful answer and suggest any relevant help articles or next steps.`;

export const SUPPORT_GUEST_QUESTION = (message: string) =>
  `Guest question: ${message}\nProvide a concise, helpful answer.`;

export const SUPPORT_DISPUTE_SUMMARY = (messages: string) =>
  `Dispute conversation:\n${messages}\nProvide a neutral 2-3 sentence summary and list key parties and issues.`;

export const SUPPORT_SUGGEST_RESPONSE = (conversation: string) =>
  `Support conversation so far:\n${conversation}\nSuggest a professional, empathetic next response for the support agent.`;
