"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Star,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const ACTIVATION_STEPS = [
  {
    id: "explore",
    title: "Explore Opportunities",
    desc: "See high-quality buyer inquiries in your region.",
    icon: <Target className="w-4 h-4" />
  },
  {
    id: "unlock",
    title: "Unlock Your First Lead",
    desc: "Get full contact info for a 50% discount.",
    icon: <DollarSign className="w-4 h-4" />
  },
  {
    id: "close",
    title: "Close Faster with AI",
    desc: "Use deal scoring to prioritize your day.",
    icon: <Zap className="w-4 h-4" />
  }
];

export function BrokerActivationMoment({ locale, country }: { locale: string; country: string }) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const base = `/${locale}/${country}`;

  useEffect(() => {
    // Auto-mark first-value shown (Phase 8)
    fetch("/api/onboarding/broker-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstValueShown: true }),
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero: Value Moment */}
      <div className="text-center space-y-4">
        <Badge variant="gold" className="px-4 py-1 tracking-[0.3em] text-[10px]">ACTIVATION MODE</Badge>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase lg:text-5xl">
          Value Shown Immediately.
        </h1>
        <p className="text-zinc-500 max-w-xl mx-auto font-bold uppercase tracking-widest text-xs">
          Welcome to LECIPM. We've matched your profile to top opportunities in Québec.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Activation Checklist */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              Your Path to First Deal
            </h2>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              Complete these steps to activate your platform benefits.
            </p>
          </div>

          <div className="space-y-3">
            {ACTIVATION_STEPS.map((step, i) => (
              <div 
                key={step.id}
                className="group relative flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl hover:border-[#D4AF37]/30 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors" />
                
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  i === 0 ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/5 text-zinc-600"
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{step.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">{step.desc}</p>
                </div>

                <ArrowRight className={`w-4 h-4 transition-all ${
                  i === 0 ? "text-[#D4AF37]" : "text-zinc-800"
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: The "First Lead Special" Hook */}
        <div className="relative group bg-zinc-900 border border-[#D4AF37]/30 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl shadow-[#D4AF37]/5">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
            <Trophy className="w-24 h-24 text-[#D4AF37] blur-3xl" />
          </div>

          <div className="relative space-y-6">
            <div className="flex justify-between items-start">
              <Badge variant="gold" className="text-[8px] tracking-[0.2em]">LIMITED TIME OFFER</Badge>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#D4AF37]">
                <Star className="w-3 h-3 fill-current" />
                NEW BROKER PERK
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                Your First Lead for $99
              </h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                We're so confident in our lead quality that we're covering the rest.
                Unlock any inquiry today and see the ROI for yourself.
              </p>
            </div>

            <div className="py-6 border-y border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Standard Price</span>
                <span className="text-sm font-bold text-zinc-600 line-through">$225</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Platform Discount</span>
                <span className="text-sm font-bold text-green-500">-$126</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-black text-white uppercase tracking-tighter">Your Special Price</span>
                <span className="text-3xl font-black text-[#D4AF37]">$99</span>
              </div>
            </div>

            <Link href={`${base}/dashboard/crm`} className="block">
              <Button variant="goldPrimary" className="w-full py-7 font-black text-[11px] tracking-[0.2em] shadow-xl shadow-[#D4AF37]/10">
                ACTIVATE NOW
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <p className="text-[9px] text-zinc-600 text-center font-bold uppercase tracking-widest">
              Available for your first purchase only.
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Proof Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase">OACIQ Aligned</p>
            <p className="text-[9px] text-zinc-600 font-medium">Compliance-first drafting.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase">Higher ROI</p>
            <p className="text-[9px] text-zinc-600 font-medium">Spend time where it counts.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase">Elite Access</p>
            <p className="text-[9px] text-zinc-600 font-medium">Join top-tier brokers.</p>
          </div>
        </div>
      </div>

      {/* Secondary Action */}
      <div className="flex justify-center pt-4">
        <Link href={`${base}/onboarding/broker`} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
          CONTINUE PLATFORM SETUP
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
