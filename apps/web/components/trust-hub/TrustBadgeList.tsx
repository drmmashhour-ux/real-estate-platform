import React from "react";
import { TrustHubBadgeInfo } from "../../modules/quebec-trust-hub/types";
import { Award, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  badges: TrustHubBadgeInfo[];
  className?: string;
}

export const TrustBadgeList: React.FC<Props> = ({ badges, className }) => {
  if (badges.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Gages de confiance</h4>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div 
            key={badge.badgeKey}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {badge.labelFr}
          </div>
        ))}
      </div>
    </div>
  );
};
