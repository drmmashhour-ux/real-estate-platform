"use client";

import { TrustBadge } from "@/modules/quebec-trust-hub/types";
import { Check } from "lucide-react";

interface Props {
  badges: TrustBadge[];
}

export function TrustBadgeList({ badges }: Props) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <div 
          key={badge.badgeKey}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        >
          <div className="bg-emerald-500 rounded-full p-0.5">
            <Check className="h-2 w-2 text-black" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{badge.labelFr}</span>
        </div>
      ))}
    </div>
  );
}
