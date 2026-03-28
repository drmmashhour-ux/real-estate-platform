"use client";

import { useState } from "react";
import { LegalAssistantChat } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantChat";

export function LegalAssistantPanel({ documentId, sectionKey }: { documentId: string; sectionKey?: string }) {
  const [open, setOpen] = useState(false);
  const [contextHealth, setContextHealth] = useState<string | null>(null);

  async function refreshContext() {
    const res = await fetch(`/api/legal-graph/${documentId}`).then((r) => r.json()).catch(() => null);
    setContextHealth(res?.summary?.fileHealth ?? null);
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">AI Legal Assistant</p>
        <button type="button" onClick={() => { const next = !open; setOpen(next); if (next) refreshContext().catch(() => undefined); }} className="text-xs text-premium-gold">{open ? "Hide" : "Open"}</button>
      </div>
      {open ? <div className="mt-2 space-y-2">{contextHealth ? <p className="text-[10px] text-slate-500">Graph health: {contextHealth}</p> : null}<LegalAssistantChat documentId={documentId} sectionKey={sectionKey} /></div> : <p className="mt-1 text-xs text-slate-500">Grounded guidance from document context only.</p>}
    </div>
  );
}
