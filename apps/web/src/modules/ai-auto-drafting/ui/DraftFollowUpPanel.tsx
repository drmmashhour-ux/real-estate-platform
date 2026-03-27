export function DraftFollowUpPanel({ questions }: { questions: string[] }) {
  if (!questions.length) return null;
  return (
    <ul className="list-inside list-decimal space-y-1 text-xs text-slate-300">
      {questions.map((q) => (
        <li key={q}>{q}</li>
      ))}
    </ul>
  );
}
