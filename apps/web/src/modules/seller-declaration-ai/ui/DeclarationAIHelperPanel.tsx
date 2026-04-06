import { SuggestionApplyButton } from "@/src/modules/seller-declaration-ai/ui/SuggestionApplyButton";
import { DeclarationFollowUpQuestions } from "@/src/modules/seller-declaration-ai/ui/DeclarationFollowUpQuestions";
import { SectionExplainDrawer } from "@/src/modules/seller-declaration-ai/ui/SectionExplainDrawer";

type Props = {
  suggestion: string;
  missingFacts: string[];
  questions: string[];
  questionAnswers: Record<string, string>;
  explain: {
    text: string;
    expectedAnswer: string;
    example: string;
    sources?: Array<{ title: string; pageNumber: number | null; importance: string; excerpt: string }>;
  } | null;
  warnings: string[];
  contentIssues?: Array<{ severity: "warning" | "block"; message: string; suggestion: string }>;
  onApply: () => void;
  onGenerateFollowUp: () => void;
  onAnswerChange: (question: string, answer: string) => void;
};

export function DeclarationAIHelperPanel({
  suggestion,
  missingFacts,
  questions,
  questionAnswers,
  explain,
  warnings,
  contentIssues = [],
  onApply,
  onGenerateFollowUp,
  onAnswerChange,
}: Props) {
  return (
    <aside className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">AI helper panel</p>
        <button type="button" onClick={onGenerateFollowUp} className="text-xs text-premium-gold hover:underline">Refresh follow-up</button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/35 p-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">AI suggestion</p>
        <p className="mt-1 text-xs text-slate-200">{suggestion || "Click Suggest on a section to generate wording."}</p>
      </div>

      {missingFacts.length ? (
        <div className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-100">
          <p className="font-medium">Missing details</p>
          <p>{missingFacts.join(" | ")}</p>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-200">
          <p className="font-medium">Warnings</p>
          <p>{warnings.join(" | ")}</p>
        </div>
      ) : null}

      {contentIssues.length ? (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-xs text-rose-100">
          <p className="font-medium">Content control</p>
          <div className="mt-1 space-y-2">
            {contentIssues.slice(0, 4).map((issue, idx) => (
              <div key={`${issue.message}-${idx}`} className="rounded-md bg-black/20 p-2">
                <p>
                  <span className="font-semibold uppercase">{issue.severity}</span>: {issue.message}
                </p>
                <p className="mt-1 text-rose-100/90">{issue.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SuggestionApplyButton onApply={onApply} />

      <div>
        <p className="mb-1 text-xs font-medium text-slate-300">Follow-up questions</p>
        <DeclarationFollowUpQuestions questions={questions} answers={questionAnswers} onAnswerChange={onAnswerChange} />
      </div>

      {explain ? (
        <SectionExplainDrawer text={explain.text} expectedAnswer={explain.expectedAnswer} example={explain.example} sources={explain.sources} />
      ) : null}
    </aside>
  );
}
