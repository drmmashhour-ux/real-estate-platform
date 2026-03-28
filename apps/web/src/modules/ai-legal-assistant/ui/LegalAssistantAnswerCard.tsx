import type { LegalAssistantResponse } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";
import { LegalAssistantActionList } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantActionList";
import { LegalAssistantSourceChips } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantSourceChips";

export function LegalAssistantAnswerCard({ answer }: { answer: LegalAssistantResponse }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs uppercase text-premium-gold">{answer.intent.replace(/_/g, " ")}</p>
      <p className="text-sm text-white">{answer.summary}</p>
      {answer.keyPoints.length ? <ul className="space-y-1 text-xs text-slate-300">{answer.keyPoints.map((k) => <li key={k}>- {k}</li>)}</ul> : null}
      {answer.warnings.length ? <p className="text-xs text-amber-200">Warnings: {answer.warnings.join(" | ")}</p> : null}
      <LegalAssistantActionList actions={answer.recommendedActions} />
      <LegalAssistantSourceChips sources={answer.sourceSections} />
      <p className="text-[10px] text-slate-500">Confidence {answer.confidence}% · grounded context only</p>
    </div>
  );
}
