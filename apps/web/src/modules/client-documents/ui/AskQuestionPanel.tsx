import { useState } from "react";

type Q = { id: string; metadata?: { text?: string; sectionKey?: string | null } };

export function AskQuestionPanel({ questions, onAsk }: { questions: Q[]; onAsk: (text: string, sectionKey?: string) => void }) {
  const [text, setText] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Ask a question</p>
      <div className="mt-2 space-y-2">
        {questions.length ? questions.map((q) => <p key={q.id} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">{q.metadata?.text}</p>) : <p className="text-xs text-slate-500">No questions yet.</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <input value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" placeholder="Section (optional)" />
        <input value={text} onChange={(e) => setText(e.target.value)} className="min-w-[220px] flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" placeholder="Type your question" />
        <button type="button" className="rounded-md bg-[#C9A646] px-3 py-1 text-xs font-medium text-black" onClick={() => { if (!text.trim()) return; onAsk(text.trim(), sectionKey.trim() || undefined); setText(""); }}>
          Send
        </button>
      </div>
    </div>
  );
}
