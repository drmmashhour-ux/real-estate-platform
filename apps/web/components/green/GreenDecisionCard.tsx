import React, { useState } from 'react';
import { Leaf, Info, TrendingUp, Search, ArrowRight, ShieldCheck, Lock, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface GreenDecisionCardProps {
  verdict: string;
  impact: "High" | "Medium" | "Low";
  rationales: string[];
  quebecLabel?: string;
  isGreenPremium?: boolean;
}

export function GreenDecisionCard({ verdict, impact, rationales, quebecLabel, isGreenPremium = false }: GreenDecisionCardProps) {
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  return (
    <Card className="bg-zinc-900/40 border-[#22c55e]/30 border-2 rounded-[3rem] overflow-hidden shadow-2xl relative">
      {!isGreenPremium && (
         <div className="absolute inset-x-0 bottom-0 top-[220px] bg-gradient-to-t from-black via-black/95 to-transparent z-20 flex flex-col items-center justify-end p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center border border-[#22c55e]/20 animate-bounce">
               <Lock className="w-8 h-8 text-[#22c55e]" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-white">Unlock Full Green Analysis</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto">
                 "See which properties are smarter decisions before you buy."
               </p>
            </div>
            <Button className="bg-[#22c55e] text-black font-black h-14 px-10 rounded-2xl shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">
               Upgrade to Premium
            </Button>
            <p className="text-[10px] text-gray-600 font-bold uppercase">Only $9.99/mo for buyers</p>
         </div>
      )}

      <CardHeader className="p-10 border-b border-white/5 bg-[#22c55e]/5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center border border-[#22c55e]/20">
              <Leaf className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white">Green AI Verdict</CardTitle>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Efficiency & Value Analysis</p>
            </div>
          </div>
          {quebecLabel && (
            <Badge variant="gold" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-black">
              {quebecLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-8">
        {/* Section 1: Verdict */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Decision Verdict</h4>
          <p className="text-2xl font-black text-white leading-tight">"{verdict}"</p>
        </div>

        {/* Section 2: Impact */}
        <div className="grid grid-cols-2 gap-4">
           <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
             <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
             <div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Improvement Potential</p>
               <p className="text-sm font-bold text-white">{impact} Impact</p>
             </div>
           </div>
           {isGreenPremium && (
             <div className="flex items-center gap-4 p-4 bg-[#22c55e]/5 rounded-2xl border border-[#22c55e]/20 animate-in zoom-in duration-500">
               <Zap className="w-5 h-5 text-[#22c55e]" />
               <div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Opportunity Score</p>
                 <p className="text-sm font-bold text-[#22c55e]">HIGH (88/100)</p>
               </div>
             </div>
           )}
        </div>

        {/* Section 3: Why */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Why this matters</h4>
             {!isGreenPremium && <Badge className="bg-white/5 text-gray-600 border-white/10 text-[8px]">PREVIEW ONLY</Badge>}
          </div>
          <div className="space-y-3">
            {rationales.slice(0, isGreenPremium ? undefined : 1).map((rationale, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mt-1.5 shrink-0" />
                <p className="text-xs text-gray-300 font-medium leading-relaxed italic">"{rationale}"</p>
              </div>
            ))}
            {!isGreenPremium && (
               <div className="p-3 bg-black/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">2 more insights locked</span>
               </div>
            )}
          </div>
        </div>

        {isGreenPremium && (
           <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-2 animate-in slide-in-from-bottom duration-700">
              <div className="flex items-center gap-2 text-blue-400">
                 <Sparkles className="w-4 h-4" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest">Future Value Indicator</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                 A green retrofit for this property is estimated to increase long-term market value by <span className="text-white font-black">9-12%</span> over standard properties in Westmount.
              </p>
           </div>
        )}

        {/* Section 4: Actions */}
        <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
          <Button className="w-full h-12 bg-[#22c55e] text-black font-black text-xs tracking-widest uppercase rounded-xl hover:scale-105 transition-transform">
            See improvement ideas
            <Search className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full h-12 border-white/10 text-white font-black text-xs tracking-widest uppercase rounded-xl hover:bg-white/5">
            Compare similar homes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 pt-4 justify-center">
          <Info className="w-3 h-3 text-gray-600" />
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic text-center">
            This is an estimate based on available data. Not an official certification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
