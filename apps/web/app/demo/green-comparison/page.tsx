"use client";

import React from 'react';
import { ArrowLeft, Share2, Heart, ShieldCheck, Leaf } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { GreenComparison } from '../../../components/green/GreenComparison';

export default function GreenComparisonDemoPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#22c55e]/30">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-black">GREEN INTELLIGENCE</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Decision Support Mode</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              Green <span className="text-[#22c55e] italic">Comparison Lab</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg font-medium leading-relaxed">
              Compare properties based on their efficiency, improvement potential, and hidden long-term value.
            </p>
          </div>
          <Button variant="outline" className="h-12 border-white/10 font-bold text-xs tracking-widest uppercase hover:bg-white/5 px-6">
             <Share2 className="w-4 h-4 mr-2" />
             SHARE REPORT
          </Button>
        </div>

        <div className="space-y-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center border border-[#22c55e]/20">
                 <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Investment-Grade Comparison</h2>
           </div>

           <GreenComparison 
             listingA={{
               name: "Modern Loft in Old Montreal",
               label: "OPTIMIZED",
               potential: "Low",
               rationale: "This property has already been fully retrofitted with modern insulation and smart heating systems. Maintenance costs are predicted to remain stable."
             }}
             listingB={{
               name: "Historic Plateau triplex",
               label: "IMPROVABLE",
               potential: "High",
               rationale: "Original single-pane windows and aging heating system. Significant hidden equity can be unlocked through a green retrofit, increasing market value by an estimated 12%."
             }}
           />

           <div className="p-8 bg-zinc-900/50 border border-dashed border-white/10 rounded-[3rem] text-center space-y-4">
              <Leaf className="w-10 h-10 text-gray-600 mx-auto" />
              <div className="space-y-2">
                 <p className="text-lg font-bold text-gray-400">Want to see more details?</p>
                 <p className="text-sm text-gray-600 max-w-sm mx-auto">Get a full efficiency breakdown and concrete improvement ideas for any property in your watchlist.</p>
              </div>
              <div className="pt-4">
                 <Button className="bg-[#22c55e] text-black font-black rounded-xl px-10 h-14 uppercase text-xs tracking-widest">
                    Unlock Full Green Report
                 </Button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
