import { answerFromKnowledgeBase } from "@/lib/demo/demo-knowledge";

const MAX_QUESTION_LEN = 600;

function sanitizeQuestion(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUESTION_LEN)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ");
}

export type AnswerDemoQuestionOptions = {
  /** When true (server env + prop), uses `/api/demo/demo-qa` for optional AI; falls back to knowledge matching on failure. */
  useAi?: boolean;
};

/**
 * Safe investor-demo answers: predefined knowledge and/or server-side AI with static context only.
 * No DB access here — optional AI calls POST /api/demo/demo-qa (read-only, no mutations).
 */
export async function answerDemoQuestion(
  question: string,
  opts?: AnswerDemoQuestionOptions,
): Promise<string> {
  const q = sanitizeQuestion(question);
  if (!q) {
    return "Please enter a question about the platform.";
  }

  const useAi = Boolean(opts?.useAi && typeof window !== "undefined");

  if (useAi) {
    try {
      const res = await fetch("/api/demo/demo-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { ok?: boolean; answer?: string; message?: string };
      if (res.ok && data.ok && typeof data.answer === "string" && data.answer.trim()) {
        return data.answer.trim();
      }
    } catch {
      /* fall through to deterministic answer */
    }
  }

  return answerFromKnowledgeBase(q);
}
