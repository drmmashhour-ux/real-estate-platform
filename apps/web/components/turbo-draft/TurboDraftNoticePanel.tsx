"use client";

import { TurboDraftNotice } from "@/modules/turbo-form-drafting/types";
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  notices: TurboDraftNotice[];
  draftId?: string;
  isRepresented?: boolean;
  onAcknowledge?: (noticeKey: string) => Promise<void>;
}

export function TurboDraftNoticePanel({ notices, draftId, isRepresented, onAcknowledge }: Props) {
  const [acks, setAcks] = useState<Record<string, boolean>>(
    Object.fromEntries(notices.filter(n => n.acknowledged).map(n => [n.noticeKey, true]))
  );
  const [busy, setBusy] = useState<string | null>(null);

  if (notices.length === 0) return null;

  async function handleAck(noticeKey: string) {
    if (!draftId || !onAcknowledge) return;
    setBusy(noticeKey);
    try {
      await onAcknowledge(noticeKey);
      setAcks(prev => ({ ...prev, [noticeKey]: true }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Legal Notices & Acknowledgments</p>
      
      {!isRepresented && (
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-black to-[#D4AF37]/5 p-6 shadow-lg shadow-[#D4AF37]/5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
              <ShieldAlert className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-tight italic text-[#D4AF37]">Review by a Professional</h4>
              <p className="text-sm leading-relaxed text-neutral-400">
                You are currently unrepresented. Get a licensed broker to review your draft for $275 to ensure full legal protection.
              </p>
              <button className="mt-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] hover:underline">
                Attach a Reviewer Broker →
              </button>
            </div>
          </div>
        </div>
      )}

      {notices.map((notice, i) => {
        const Icon = notice.severity === "CRITICAL" ? AlertCircle : notice.severity === "WARNING" ? AlertTriangle : ShieldCheck;
        const colors = {
          CRITICAL: "border-red-500/50 bg-red-950/10 text-red-200",
          WARNING: "border-premium-gold/50 bg-premium-gold/5 text-premium-gold",
          INFO: "border-blue-500/50 bg-blue-950/10 text-blue-200",
        };

        const isAcked = acks[notice.noticeKey];
        const isCritical = notice.severity === "CRITICAL";

        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl border p-6 transition-all duration-500",
              colors[notice.severity],
              isAcked && "opacity-60 border-neutral-800 bg-neutral-900/50 text-neutral-400"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5",
                  !isAcked && "animate-pulse"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-tight italic">{notice.title}</h3>
                  <p className="text-sm leading-relaxed opacity-90">{notice.content}</p>
                </div>
              </div>
              
              {isCritical && !isAcked && draftId && (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => handleAck(notice.noticeKey)}
                  className="bnhub-touch-feedback shrink-0 rounded-xl bg-premium-gold px-6 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-premium-gold/20"
                >
                  {busy === notice.noticeKey ? "..." : "Acknowledge"}
                </button>
              )}

              {isAcked && (
                <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Accepted
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
