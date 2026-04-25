import React from "react";
import { getInvestorMetrics, getInvestorSnapshot } from "@/modules/investor/metrics.service";
import { generateInvestorNarrative } from "@/modules/investor/narrative.engine";
import { PitchDeck } from "@/components/investor/PitchDeck";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvestorDashboardPage() {
  const metrics = await getInvestorMetrics();
  const snapshot = await getInvestorSnapshot();
  const narrative = generateInvestorNarrative(metrics);

  return (
    <main className="min-h-screen bg-black text-white p-8 lg:p-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <Badge variant={snapshot.status === "BULLISH" ? "gold" : "outline"} className="px-4 py-1 tracking-[0.3em] text-[10px] font-black uppercase">
            {snapshot.status} SIGNAL
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            Board <span className="text-[#D4AF37]">Command.</span>
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-lg">
            {snapshot.note} Real-time traction, automated reporting, and the path to real estate category leadership.
          </p>
        </div>
        <div className="flex items-center gap-6 bg-zinc-900/50 border border-white/5 px-8 py-6 rounded-[2rem]">
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Growth MoM</p>
            <p className="text-2xl font-black text-green-500">
              {(metrics.revenueGrowthMonthOverMonth * 100).toFixed(1)}%
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Scale</p>
            <p className="text-2xl font-black text-white">{metrics.activeBrokers}</p>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900/30 border-white/5 p-8 rounded-[2.5rem] space-y-4">
          <ShieldCheck className="w-6 h-6 text-green-500" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Compliance Status</p>
          <p className="text-xl font-black text-white uppercase tracking-tight">OACIQ Ready</p>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">99.8% Accuracy</p>
        </Card>
        <Card className="bg-zinc-900/30 border-white/5 p-8 rounded-[2.5rem] space-y-4">
          <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LTV to CAC</p>
          <p className="text-xl font-black text-white uppercase tracking-tight">4.2x (est.)</p>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">High Retension</p>
        </Card>
        <Card className="bg-zinc-900/30 border-white/5 p-8 rounded-[2.5rem] space-y-4">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Key Risks</p>
          <p className="text-xl font-black text-white uppercase tracking-tight">{narrative.risks[0].slice(0, 15)}...</p>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Active Mitigation</p>
        </Card>
        <Card className="bg-zinc-900/30 border-white/5 p-8 rounded-[2.5rem] space-y-4">
          <Lightbulb className="w-6 h-6 text-blue-400" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Top Opportunity</p>
          <p className="text-xl font-black text-white uppercase tracking-tight">National Scale</p>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Expansion Ready</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Pitch Deck */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Live <span className="text-[#D4AF37]">Investor</span> Story</h2>
            <Badge variant="outline" className="border-white/10 text-zinc-600 text-[9px] font-black tracking-widest py-1">REAL-TIME DATA</Badge>
          </div>
          <PitchDeck metrics={metrics} narrative={narrative} />
        </div>

        {/* Right: Highlights & Updates */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Board Summary</h3>
            <div className="space-y-6">
              {narrative.highlights.map((h, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2 shrink-0" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-white/5 space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Next Board Action</p>
              <button className="w-full bg-[#D4AF37] text-black font-black text-[10px] tracking-widest py-4 rounded-2xl shadow-xl shadow-[#D4AF37]/10 hover:scale-105 transition-all uppercase">
                Download Weekly PDF
              </button>
            </div>
          </section>

          <Card className="bg-zinc-900/50 border-white/5 rounded-[2.5rem] p-8 space-y-4">
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Upcoming Milestones</h3>
             <div className="space-y-4">
               {[
                 { label: "1,000 Active Brokers", status: "In Progress" },
                 { label: "Ontario Market Launch", status: "Seed Stage" },
                 { label: "AI Drafting Patent", status: "Submitted" }
               ].map((m, i) => (
                 <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                   <span className="text-white tracking-widest">{m.label}</span>
                   <span className="text-zinc-600 tracking-tight">{m.status}</span>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
