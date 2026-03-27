const prompts = [
  "Explain this section",
  "What is missing?",
  "Why is this flagged?",
  "What should I do next?",
  "Draft follow-up questions",
  "Compare versions",
  "Is this ready for signature?",
];

export function LegalAssistantQuickPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {prompts.map((p) => (
        <button key={p} type="button" onClick={() => onPick(p)} className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10">
          {p}
        </button>
      ))}
    </div>
  );
}
