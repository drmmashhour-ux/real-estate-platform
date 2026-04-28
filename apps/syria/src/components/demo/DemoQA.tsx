"use client";

import { useState } from "react";
import { answerDemoQuestion } from "@/lib/demo/demo-qa";

type Props = {
  /** Server flag `DEMO_QA_AI_ENABLED` — enables optional OpenAI path with static knowledge context only. */
  aiEnhanced?: boolean;
};

export function DemoQA({ aiEnhanced = false }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const text = await answerDemoQuestion(question, { useAi: aiEnhanced });
      setAnswer(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setAnswer(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-stone-50/90 p-6 shadow-sm [dir=rtl]:text-right"
      aria-labelledby="demo-qa-heading"
    >
      <h2 id="demo-qa-heading" className="text-lg font-semibold text-stone-900">
        💬 Ask about the platform
      </h2>
      <p className="mt-1 text-xs text-stone-600">
        Demo-only answers from predefined knowledge
        {aiEnhanced ? " (with optional AI summarisation — no live data)" : ""}. Not legal or financial advice.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <label className="sr-only" htmlFor="demo-qa-input">
          Your question
        </label>
        <input
          id="demo-qa-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="e.g. How are payments handled in the demo?"
          className="min-h-[44px] w-full flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          disabled={pending}
          autoComplete="off"
          maxLength={600}
        />
        <button
          type="button"
          disabled={pending || !question.trim()}
          onClick={() => void submit()}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-amber-600 bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {pending ? "…" : "Send"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="mt-4 rounded-xl border border-white bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-inner">
          {answer}
        </div>
      ) : (
        !pending &&
        !error && (
          <p className="mt-3 text-xs text-stone-500">
            Responses use demo-safe summaries only — no access to your bookings, payments, or profile.
          </p>
        )
      )}
    </section>
  );
}
