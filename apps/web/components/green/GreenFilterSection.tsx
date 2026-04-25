import React from 'react';
import { Leaf, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function GreenFilterSection() {
  return (
    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Leaf className="w-3 h-3 text-[#22c55e]" />
          Green Intelligence
        </h3>
        <Badge variant="outline" className="text-[8px] text-[#22c55e] border-[#22c55e]/30 font-black">AI FILTER</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button className="flex items-center justify-between p-4 bg-white/5 border border-[#22c55e]/20 rounded-2xl group hover:bg-[#22c55e]/5 transition-all">
          <span className="text-xs font-bold text-white group-hover:text-[#22c55e]">Improvable or better</span>
          <div className="w-4 h-4 rounded-full border-2 border-[#22c55e] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          </div>
        </button>
        <button className="flex items-center justify-between p-4 bg-transparent border border-white/5 rounded-2xl group hover:bg-white/5 transition-all">
          <span className="text-xs font-bold text-gray-500 group-hover:text-white">Optimized only</span>
          <div className="w-4 h-4 rounded-full border-2 border-white/20" />
        </button>
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[10px] text-gray-600 font-medium italic leading-relaxed">
          "Focusing on improvable properties helps you find hidden equity."
        </p>
      </div>
    </div>
  );
}
