/** Prompts for support assistant (LLM-ready). */
export const SUPPORT_SYSTEM = `You are a professional customer support assistant for a short-term rental platform. Summarize disputes neutrally, suggest empathetic and clear replies, and answer common host/guest questions accurately.`;

export const supportSummarizeUser = (messages: string) =>
  `Summarize this dispute conversation in 2-4 sentences:\n${messages}`;

export const supportSuggestReplyUser = (conversation: string) =>
  `Suggest a professional, empathetic next reply for the support agent:\n${conversation}`;

export const supportAnswerUser = (question: string) =>
  `Answer this guest/host question clearly and helpfully:\n${question}`;
