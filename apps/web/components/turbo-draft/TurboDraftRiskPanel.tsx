"use client";

import { TurboDraftRisk } from "@/modules/turbo-form-drafting/types";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  risks: TurboDraftRisk[];
  locale?: "fr" | "en";
}

export function TurboDraftRiskPanel({ risks, locale = "fr" }: Props) {
  if (risks.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Compliance & Risks</p>
      {risks.map((risk, i) => {
        const Icon = risk.severity === "CRITICAL" ? AlertCircle : risk.severity === "WARNING" ? AlertTriangle : Info;
        const colors = {
          CRITICAL: "border-red-500/50 bg-red-950/20 text-red-200",
          WARNING: "border-premium-gold/50 bg-premium-gold/10 text-premium-gold",
          INFO: "border-blue-500/50 bg-blue-950/20 text-blue-200",
        };

        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 transition-all duration-300",
              colors[risk.severity]
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold leading-tight">
                {locale === "fr" ? risk.messageFr : risk.messageEn}
              </p>
              {risk.blocking && (
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  ⚠️ Blocks Signature
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
