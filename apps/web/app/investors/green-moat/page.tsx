"use client";

import React from 'react';
import { 
  Leaf, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Lock, 
  Brain, 
  Layers, 
  BarChart3, 
  ArrowRight,
  Target,
  Sparkles,
  Search,
  HelpCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GreenMoatPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#22c55e]/30">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-black">Strategic Moat</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Green AI v4.0</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none">
              Green AI: Our <span className="text-[#22c55e] italic text-7xl">Competitive Advantage.</span>
            </h1>
            <p className="text-gray-400 max-w-3xl text-xl font-medium leading-relaxed">
              How we're turning sustainability signals into hidden equity detection and a multi-million dollar revenue stream.
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-16 px-8 border-white/10 rounded-[1.5rem] font-black text-xs tracking-widest uppercase hover:bg-white/5">
                Download Deck
             </Button>
             <Button className="bg-[#22c55e] text-black h-16 px-10 rounded-[1.5rem] font-black text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                Investor Portal
             </Button>
          </div>
        </div>

        {/* Section 1 & 2: Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <Card className="p-10 bg-zinc-900/40 border-white/5 rounded-[3rem] space-y-6">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                 <Lock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">The Information Gap</h2>
              <p className="text-gray-400 text-lg leading-relaxed italic">
                "Buyers cannot easily identify which properties have hidden value or long-term efficiency potential. They see price and photos, but miss the energy-equity equation."
              </p>
           </Card>
           <Card className="p-10 bg-[#22c55e]/5 border-[#22c55e]/30 border-2 rounded-[3rem] space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Leaf className="w-24 h-24 text-[#22c55e]" />
              </div>
              <div className="w-14 h-14 bg-[#22c55e]/20 rounded-2xl flex items-center justify-center border border-[#22c55e]/30 relative z-10">
                 <Brain className="w-8 h-8 text-[#22c55e]" />
              </div>
              <h2 className="text-3xl font-black tracking-tight relative z-10">The LECIPM Solution</h2>
              <p className="text-white text-lg font-bold leading-relaxed relative z-10">
                LECIPM analyzes listings and highlights improvement opportunities using structured signals and Green AI, turning "old homes" into "high-potential equity assets."
              </p>
           </Card>
        </div>

        {/* Section 3: Differentiation */}
        <section className="space-y-10 pt-10">
           <div className="text-center space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Why we're different</h3>
              <h2 className="text-4xl font-black tracking-tight italic text-[#D4AF37]">Not Generic AI. Domain Intelligence.</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "No Hallucinations", text: "Uses structured real estate signals only.", icon: ShieldCheck, color: "#22c55e" },
                { title: "Explainable", text: "Decision rationale provided for every tag.", icon: MessageSquare, color: "#3b82f6" },
                { title: "Full Integration", text: "Embedded in search, browse, and drafting.", icon: Layers, color: "#a855f7" },
                { title: "Regulatory-Safe", text: "Compliant with Québec's strict data rules.", icon: ShieldCheck, color: "#D4AF37" }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-zinc-900/60 border border-white/5 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-all text-center">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-white/5 border border-white/10">
                      <item.icon className="w-6 h-6" style={{ color: item.color }} />
                   </div>
                   <h4 className="font-black text-sm uppercase tracking-widest text-white">{item.title}</h4>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Section 4: Why it's hard to copy */}
        <section className="p-16 bg-[linear-gradient(135deg,#0D0D0D,#050505)] border border-[#22c55e]/20 rounded-[4rem] relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.05)]">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/5 rounded-full blur-[120px] -mr-[250px] -mt-[250px]" />
           <div className="max-w-4xl mx-auto space-y-12 relative z-10 text-center">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.4em]">The Moat</h3>
                 <h2 className="text-5xl font-black tracking-tighter text-white">Why a competitor can't simply <span className="text-[#22c55e]">"plug in"</span> ChatGPT.</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                 <div className="space-y-3">
                    <h4 className="text-lg font-black text-white flex items-center gap-3">
                       <BarChart3 className="w-5 h-5 text-[#22c55e]" />
                       Structured Data Layer
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                       Our engine processes raw Centris/OACIQ data into high-dimension signals that generic LLMs don't have access to.
                    </p>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-lg font-black text-white flex items-center gap-3">
                       <Zap className="w-5 h-5 text-[#3b82f6]" />
                       Integrated Success Flow
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                       Green AI isn't just a widget; it's a gate in our drafting and compliance engine, making it indispensable for transaction success.
                    </p>
                 </div>
              </div>

              {/* Hard Investor Q&A */}
              <div className="pt-16 border-t border-white/5 space-y-8">
                 <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-[0.3em]">Hard Investor Q&A</h3>
                 <div className="grid grid-cols-1 gap-6 text-left">
                    {[
                      { q: "Why stops Zillow/Airbnb from copying this?", a: "They would need to rebuild a structured data + compliance-aware + explainable decision layer across multiple flows. We’re not a feature—we’re a layer integrated into the transaction process." },
                      { q: "Why would users pay for this?", a: "Because it reduces uncertainty. We don’t just show listings—we show which ones are smarter decisions and why. That directly impacts buying confidence." },
                      { q: "Is this just a UX improvement?", a: "No. UX is the surface. The value is the decision engine underneath—ranking, reasoning, and opportunity detection." },
                      { q: "What's your moat long-term?", a: "Data accumulation from real-world behavior, our explainability layer, and deep integration across search → draft → transaction." }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                         <p className="text-sm font-black text-white flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                            {item.q}
                         </p>
                         <p className="text-xs text-gray-400 leading-relaxed italic">
                            "{item.a}"
                         </p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Section 5: Monetization */}
        <section className="space-y-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 text-left">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Revenue Model</h3>
                 <h2 className="text-4xl font-black tracking-tight">The Green Premium Tier.</h2>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-[#22c55e]/10 text-[#22c55e] px-4 py-2 border-[#22c55e]/20 text-[10px] font-black">Projected ARPU: $14.99</Badge>
              </div>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { 
                  title: "Advanced Insights", 
                  price: "$9/mo", 
                  target: "Regular Buyers", 
                  features: ["Detailed Rationale", "Deeper Opportunity Breakdown", "Advanced Signals"],
                  icon: Sparkles 
                },
                { 
                  title: "Professional Green", 
                  price: "$19/mo", 
                  target: "Investors & Power Users", 
                  features: ["Full Comparison Mode", "Equity Scoring", "Future Value Indicator"],
                  icon: TrendingUp,
                  featured: true 
                },
                { 
                  title: "Broker Intelligence", 
                  price: "Included", 
                  target: "Professional Hub", 
                  features: ["Stronger Client Trust", "Listing Differentiation", "Better Explanations"],
                  icon: ShieldCheck 
                }
              ].map((tier, i) => (
                <Card key={i} className={cn(
                  "p-10 rounded-[3.5rem] flex flex-col h-full border-2 transition-all group hover:scale-[1.02]",
                  tier.featured ? "bg-[#22c55e]/10 border-[#22c55e]/40 shadow-[0_0_80px_rgba(34,197,94,0.1)]" : "bg-zinc-900/40 border-white/5"
                )}>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{tier.target}</p>
                      <h4 className="text-3xl font-black text-white">{tier.title}</h4>
                   </div>
                   <div className="my-8 flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white">{tier.price}</span>
                      {tier.price !== "Included" && <span className="text-gray-600 font-bold uppercase text-xs">/ month</span>}
                   </div>
                   <ul className="space-y-5 flex-1">
                      {tier.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                           {f}
                        </li>
                      ))}
                   </ul>
                   <div className="pt-10">
                      <Button className={cn(
                        "w-full h-14 rounded-2xl font-black text-xs tracking-widest uppercase transition-all",
                        tier.featured ? "bg-[#22c55e] text-black shadow-lg" : "bg-white/5 text-white hover:bg-white/10"
                      )}>
                         Upgrade Now
                      </Button>
                   </div>
                </Card>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
