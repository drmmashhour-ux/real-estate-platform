import { useState } from "react";
import type { LegalAssistantResponse } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";
import { LegalAssistantAnswerCard } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantAnswerCard";
import { LegalAssistantPromptBar } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantPromptBar";
import { LegalAssistantQuickPrompts } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantQuickPrompts";

export function LegalAssistantChat({ documentId, sectionKey }: { documentId: string; sectionKey?: string }) {
  const [answers, setAnswers] = useState<LegalAssistantResponse[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(message: string) {
    setLoading(true);
    const res = await fetch("/api/legal-assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, message, sectionKey }),
    });
    const json = await res.json();
    if (json?.answer) setAnswers((prev) => [json.answer, ...prev].slice(0, 8));
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <LegalAssistantQuickPrompts onPick={ask} />
      <LegalAssistantPromptBar onSend={ask} />
      {loading ? <p className="text-xs text-slate-400">Thinking...</p> : null}
      <div className="space-y-2">
        {answers.length ? answers.map((a, i) => <LegalAssistantAnswerCard key={`${a.intent}-${i}`} answer={a} />) : <p className="text-xs text-slate-500">No answers yet.</p>}
      </div>
    </div>
  );
}
