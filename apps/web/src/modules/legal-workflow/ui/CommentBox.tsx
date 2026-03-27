import { useState } from "react";

type Comment = {
  id: string;
  actorUserId: string;
  createdAt: string | Date;
  metadata?: { text?: string; sectionKey?: string | null };
};

export function CommentBox({ comments, onSubmit }: { comments: Comment[]; onSubmit: (text: string, sectionKey?: string) => void }) {
  const [text, setText] = useState("");
  const [sectionKey, setSectionKey] = useState("");

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Comments</p>
      <div className="space-y-1 text-xs">
        {comments.length ? comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-white/5 px-2 py-1 text-slate-300">
            <span className="text-slate-500">{c.actorUserId}</span>: {c.metadata?.text ?? ""}
            {c.metadata?.sectionKey ? <span className="text-slate-500"> ({c.metadata.sectionKey})</span> : null}
          </div>
        )) : <p className="text-slate-500">No comments yet.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} placeholder="Section key (optional)" className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add comment" className="min-w-[220px] flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" />
        <button
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            onSubmit(text.trim(), sectionKey.trim() || undefined);
            setText("");
          }}
          className="rounded-md bg-[#C9A646] px-3 py-1 text-xs font-medium text-black"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}
