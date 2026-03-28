import { useState } from "react";

export function LegalAssistantPromptBar({ onSend }: { onSend: (message: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white" placeholder="Ask a legal workflow question" />
      <button type="button" onClick={() => { if (!text.trim()) return; onSend(text.trim()); setText(""); }} className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-medium text-black">Ask</button>
    </div>
  );
}
