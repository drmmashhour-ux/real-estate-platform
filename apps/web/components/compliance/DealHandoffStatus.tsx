import React from "react";

export function DealHandoffStatus({ 
  handoffReady, 
  packetId 
}: { 
  handoffReady: boolean; 
  packetId?: string;
}) {
  if (handoffReady) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 ring-1 ring-emerald-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4.13-5.69z" clipRule="evenodd" />
        </svg>
        Handoff Ready
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ring-1 ring-slate-500/20">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.5 10a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" clipRule="evenodd" />
      </svg>
      In Preparation
    </div>
  );
}
