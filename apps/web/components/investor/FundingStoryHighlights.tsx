"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Cpu, Maximize, DollarSign, ShieldCheck, Zap, Globe } from "lucide-react";

export function FundingStoryHighlights() {
  const pillars = [
    {
      title: "AI Differentiation",
      description: "Proprietary 'Green AI' decision layer. We don't just generate text; we identify hidden asset value and ROI signals generic LLMs miss.",
      icon: <Cpu className="w-6 h-6 text-[#D4AF37]" />,
      detail: "Custom-trained models on OACIQ compliance and Québec market data."
    },
    {
      title: "Scalability",
      description: "Modular engine built for expansion. Standardized OACIQ drafting logic maps directly to Ontario (RECO) and BC frameworks.",
      icon: <Maximize className="w-6 h-6 text-[#D4AF37]" />,
      detail: "Current tech stack handles 10x growth with zero infra modification."
    },
    {
      title: "Revenue Model",
      description: "High-margin multi-stream revenue: $99-$225/lead (Marketplace) + $79/mo (SaaS) + 15% Shared Upside (Success Fee).",
      icon: <DollarSign className="w-6 h-6 text-[#D4AF37]" />,
      detail: "Compounding value as brokers become dependent on LECIPM automation."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Funding <span className="text-[#D4AF37]">Story</span></h2>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <Card key={i} className="bg-zinc-900/50 border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
            <CardContent className="p-8 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                {p.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{p.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {p.description}
                </p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{p.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
