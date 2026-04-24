"use client";

import React from "react";
import { Info, Target, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiTransparencySectionProps {
  reasoning?: string;
  confidence?: number;
  disclaimer?: string;
  className?: string;
}

export function AiTransparencySection({ 
  reasoning, 
  confidence, 
  disclaimer,
  className 
}: AiTransparencySectionProps) {
  if (!reasoning && !confidence && !disclaimer) return null;

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden", className)}>
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">AI Transparency & Reasoning</span>
        </div>
        {confidence !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Confidence:</span>
            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  confidence > 0.8 ? "bg-emerald-500" : confidence > 0.5 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className={cn(
              "text-[10px] font-bold",
              confidence > 0.8 ? "text-emerald-600" : confidence > 0.5 ? "text-amber-600" : "text-rose-600"
            )}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-3">
        {reasoning && (
          <div className="flex gap-2.5">
            <Target className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">AI Reasoning</span>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{reasoning}"
              </p>
            </div>
          </div>
        )}

        {disclaimer && (
          <div className="flex gap-2.5 pt-2 border-t border-slate-100">
            <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Compliance Disclaimer</span>
              <p className="text-[10px] text-amber-700/80 leading-tight">
                {disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-3 py-1.5 flex justify-end border-t border-slate-100">
        <button className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
          View full audit trace <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
