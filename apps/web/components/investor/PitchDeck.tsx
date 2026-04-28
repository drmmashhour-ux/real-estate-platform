"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Zap, Target, TrendingUp, Users, ShieldCheck, Globe, Star } from "lucide-react";
import { InvestorMetrics } from "@/modules/investor/metrics.service";
import { InvestorNarrative } from "@/modules/investor/narrative.engine";

interface Props {
  metrics: InvestorMetrics;
  narrative: InvestorNarrative;
}

export function PitchDeck({ metrics, narrative }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "1. Vision",
      content: (
        <div className="space-y-6 text-center py-20">
          <h2 className="text-4xl font-black text-[#D4AF37] uppercase tracking-tighter">LECIPM</h2>
          <p className="text-2xl font-bold text-white max-w-2xl mx-auto italic">
            "{narrative.vision}"
          </p>
          <div className="pt-10 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Focus</p>
              <p className="text-sm font-black text-white">AI Real Estate</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Region</p>
              <p className="text-sm font-black text-white">Québec / Canada</p>
            </div>
          </div>
        </div>
      ),
      icon: <Globe className="w-8 h-8 text-[#D4AF37]" />,
    },
    {
      title: "2. Problem",
      content: (
        <div className="space-y-8 py-10">
          <h3 className="text-3xl font-black text-white uppercase leading-tight">
            Brokers are drowning in <span className="text-rose-500">Paperwork</span> and <span className="text-rose-500">Noise.</span>
          </h3>
          <p className="text-lg text-zinc-400 font-medium">
            {narrative.problem}
          </p>
          <ul className="space-y-4">
            {[
              "40% of time wasted on low-intent leads",
              "Complex OACIQ compliance anxiety",
              "No structured data on property potential"
            ].map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-white font-bold">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      ),
      icon: <Target className="w-8 h-8 text-rose-500" />,
    },
    {
      title: "3. Solution",
      content: (
        <div className="space-y-8 py-10">
          <h3 className="text-3xl font-black text-white uppercase leading-tight">
            The <span className="text-[#D4AF37]">Decision Layer</span> for Real Estate.
          </h3>
          <p className="text-lg text-zinc-400 font-medium">
            {narrative.solution}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-zinc-900/50 border border-[#D4AF37]/20 rounded-3xl">
              <Zap className="w-6 h-6 text-[#D4AF37] mb-3" />
              <p className="font-black text-white text-xs uppercase tracking-widest">Instant Drafting</p>
              <p className="text-[10px] text-zinc-500 mt-2">Generate compliant OACIQ forms in under 2 minutes.</p>
            </div>
            <div className="p-6 bg-zinc-900/50 border border-[#D4AF37]/20 rounded-3xl">
              <Star className="w-6 h-6 text-[#D4AF37] mb-3" />
              <p className="font-black text-white text-xs uppercase tracking-widest">Value Detection</p>
              <p className="text-[10px] text-zinc-500 mt-2">Green AI identifies hidden renovation/rental potential.</p>
            </div>
          </div>
        </div>
      ),
      icon: <Zap className="w-8 h-8 text-[#D4AF37]" />,
    },
    {
      title: "4. Product",
      content: (
        <div className="space-y-8 py-10">
          <div className="aspect-video bg-zinc-800 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent" />
            <p className="text-zinc-600 font-black uppercase tracking-[0.2em] z-10">Interactive Demo Snapshot</p>
          </div>
          <div className="flex justify-center gap-6">
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Turbo Draft</p>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Broker Command Center</p>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Compliance Engine</p>
          </div>
        </div>
      ),
      icon: <Target className="w-8 h-8 text-blue-400" />,
    },
    {
      title: "5. Traction",
      content: (
        <div className="space-y-10 py-10">
          <h3 className="text-3xl font-black text-white uppercase">Real Momentum.</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Brokers</p>
              <p className="text-3xl font-black text-white">{metrics.activeBrokers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Revenue (CAD)</p>
              <p className="text-3xl font-black text-[#D4AF37]">${metrics.totalRevenueCad.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lead Conv.</p>
              <p className="text-3xl font-black text-green-500">{(metrics.leadConversionRate * 100).toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retention</p>
              <p className="text-3xl font-black text-white">{(metrics.brokerRetentionRate * 100).toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">
            {narrative.traction}
          </p>
        </div>
      ),
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
    },
    {
      title: "6. Business Model",
      content: (
        <div className="space-y-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl">
              <p className="font-black text-[#D4AF37] text-lg">$99 - $225</p>
              <p className="text-[10px] font-black text-white uppercase mt-1">Lead Marketplace</p>
              <p className="text-[9px] text-zinc-500 mt-3">High-intent buyer/seller leads.</p>
            </div>
            <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl">
              <p className="font-black text-[#D4AF37] text-lg">$79 /mo</p>
              <p className="text-[10px] font-black text-white uppercase mt-1">Broker Pro SaaS</p>
              <p className="text-[9px] text-zinc-500 mt-3">Advanced AI insights & automation.</p>
            </div>
            <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl">
              <p className="font-black text-[#D4AF37] text-lg">15%</p>
              <p className="text-[10px] font-black text-white uppercase mt-1">Success Fee</p>
              <p className="text-[9px] text-zinc-500 mt-3">Shared upside on closed deals.</p>
            </div>
          </div>
        </div>
      ),
      icon: <TrendingUp className="w-8 h-8 text-[#D4AF37]" />,
    },
    {
      title: "7. Market",
      content: (
        <div className="space-y-8 py-10 text-center">
          <div className="space-y-2">
            <p className="text-6xl font-black text-white tracking-tighter">$2B+</p>
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Annual Commisions in Québec</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-10">
            <div>
              <p className="text-xl font-black text-white">16,000</p>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Brokers</p>
            </div>
            <div>
              <p className="text-xl font-black text-white">120,000</p>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Transactions</p>
            </div>
            <div>
              <p className="text-xl font-black text-white">80%</p>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Tech Gap</p>
            </div>
          </div>
        </div>
      ),
      icon: <Globe className="w-8 h-8 text-blue-400" />,
    },
    {
      title: "8. Growth",
      content: (
        <div className="space-y-6 py-10">
          {[
            { phase: "Phase 1: Domination", goal: "Capture 5% of Montréal elite brokers." },
            { phase: "Phase 2: Expansion", goal: "Launch Toronto and Vancouver chapters." },
            { phase: "Phase 3: ecosystem", goal: "Full end-to-end transaction funding." }
          ].map((g, i) => (
            <div key={i} className="flex gap-6 items-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-[#D4AF37]">
                {i+1}
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">{g.phase}</p>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{g.goal}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
    },
    {
      title: "9. Team",
      content: (
        <div className="py-20 text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-zinc-800 rounded-full mx-auto" />
          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Founder & Core Team</h4>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Real Estate Veterans + AI Engineers</p>
        </div>
      ),
      icon: <Users className="w-8 h-8 text-white" />,
    },
    {
      title: "10. Ask",
      content: (
        <div className="space-y-10 py-10 text-center">
          <div className="space-y-4">
            <h3 className="text-4xl font-black text-[#D4AF37] uppercase tracking-tighter">Raising $1.5M</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Seed Round for Canadian Domination</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Allocation</p>
              <p className="text-xs text-white font-bold mt-2">60% Product & AI</p>
              <p className="text-xs text-white font-bold">30% Sales / Growth</p>
              <p className="text-xs text-white font-bold">10% Operations</p>
            </div>
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Milestones</p>
              <p className="text-xs text-white font-bold mt-2">1,000 Active Brokers</p>
              <p className="text-xs text-white font-bold">$2M ARR run-rate</p>
            </div>
          </div>
        </div>
      ),
      icon: <Target className="w-8 h-8 text-[#D4AF37]" />,
    },
  ];

  const slide = slides[currentSlide];

  return (
    <Card className="bg-black border-white/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-[#D4AF37]/5 min-h-[600px] flex flex-col">
      <CardHeader className="bg-zinc-900/50 border-b border-white/5 p-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
            {slide.icon}
          </div>
          <CardTitle className="text-lg font-black text-white uppercase tracking-[0.2em]">{slide.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-3 rounded-full bg-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest w-12 text-center">
            {currentSlide + 1} / {slides.length}
          </span>
          <button 
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-3 rounded-full bg-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-10 bg-black relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
        <div className="relative h-full animate-in fade-in slide-in-from-right-4 duration-500">
          {slide.content}
        </div>
      </CardContent>
    </Card>
  );
}
