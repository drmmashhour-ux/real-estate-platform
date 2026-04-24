"use client";

import { DetectedNotice } from "@/modules/notice-engine/noticeEngine";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface NoticeBlockProps {
  notice: DetectedNotice;
  className?: string;
}

export default function NoticeBlock({ notice, className }: NoticeBlockProps) {
  const Icon = notice.severity === "CRITICAL" 
    ? AlertCircle 
    : notice.severity === "WARNING" 
      ? AlertTriangle 
      : ShieldCheck;

  const severityColors = {
    CRITICAL: "border-red-500/50 bg-red-950/20 text-red-200",
    WARNING: "border-premium-gold/50 bg-premium-gold/10 text-premium-gold",
    INFO: "border-blue-500/50 bg-blue-950/20 text-blue-200",
  };

  return (
    <div className={cn(
      "border-l-4 p-4 mb-4 rounded-r-xl transition-all duration-300 shadow-lg",
      severityColors[notice.severity],
      className
    )}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <h3 className="font-bold tracking-tight uppercase text-xs italic">{notice.title}</h3>
      </div>
      <p className="text-sm mt-2 leading-relaxed opacity-90">{notice.content}</p>
      {notice.severity === "CRITICAL" && (
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-60 italic">
          Acknowledgment Required
        </p>
      )}
    </div>
  );
}
