import React from 'react';
import { Leaf, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface GreenComparisonProps {
  listingA: {
    name: string;
    label: string;
    potential: string;
    rationale: string;
  };
  listingB: {
    name: string;
    label: string;
    potential: string;
    rationale: string;
  };
}

export function GreenComparison({ listingA, listingB }: GreenComparisonProps) {
  return (
    <Card className="bg-zinc-900/60 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
        
        {/* Listing A */}
        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Property A</h4>
            <h3 className="text-xl font-black text-white">{listingA.name}</h3>
          </div>
          <div className="flex flex-col gap-4">
            <Badge variant="gold" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 w-fit">
              {listingA.label}
            </Badge>
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{listingA.potential} Potential</span>
            </div>
            <p className="text-sm text-gray-400 font-medium italic leading-relaxed">
              "{listingA.rationale}"
            </p>
          </div>
        </div>

        {/* Listing B */}
        <div className="p-10 space-y-6 bg-white/[0.02]">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Property B</h4>
            <h3 className="text-xl font-black text-white">{listingB.name}</h3>
          </div>
          <div className="flex flex-col gap-4">
            <Badge variant="gold" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 w-fit">
              {listingB.label}
            </Badge>
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{listingB.potential} Potential</span>
            </div>
            <p className="text-sm text-gray-400 font-medium italic leading-relaxed">
              "{listingB.rationale}"
            </p>
          </div>
        </div>

      </div>
      <div className="p-6 bg-[#22c55e]/5 border-t border-[#22c55e]/10 flex items-center justify-center gap-2">
        <Leaf className="w-4 h-4 text-[#22c55e]" />
        <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest">Green AI Comparison Mode Active</span>
      </div>
    </Card>
  );
}
