type Props = {
  questions: string[];
  answers: Record<string, string>;
  onAnswerChange: (question: string, answer: string) => void;
};

export function DeclarationFollowUpQuestions({ questions, answers, onAnswerChange }: Props) {
  if (!questions.length) return <p className="text-xs text-slate-500">No follow-up questions.</p>;
  return (
    <div className="space-y-2">
      {questions.map((q) => (
        <label key={q} className="block rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-200">
          <span>{q}</span>
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 p-2 text-xs text-white"
            placeholder="Add detail"
            value={answers[q] ?? ""}
            onChange={(e) => onAnswerChange(q, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
