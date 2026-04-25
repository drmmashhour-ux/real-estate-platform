"use client";

import React, { useState, useEffect } from "react";
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  Target, 
  BarChart3, 
  ChevronRight, 
  ShieldCheck, 
  ArrowUpRight,
  Zap,
  Info,
  Trophy,
  RefreshCcw,
  Flag
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TARGET_REGIONS, CITIES } from "@/modules/growth/geo-target.config";

// --- Types ---

interface MarketStats {
  cityName: string;
  totalBrokers: number;
  activeBrokers: number;
  totalDeals: number;
  totalRevenue: number;
  readinessScore: number;
  isReadyForExpansion: boolean;
  province: string;
  focus: string;
}

export function MarketDashboardClient() {
  const [markets, setMarkets] = useState<MarketStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarket, setActiveMarket] = useState<string>("Montreal");

  useEffect(() => {
    fetchMarketStats();
  }, []);

  const fetchMarketStats = async () => {
    setLoading(true);
    try {
      // Mocking fetch for now since we'd need an API endpoint
      // In reality: const res = await fetch("/api/growth/markets");
      const mockStats: MarketStats[] = TARGET_REGIONS.map(city => ({
        cityName: city,
        totalBrokers: city === "Montreal" ? 120 : city === "Laval" ? 45 : 12,
        activeBrokers: city === "Montreal" ? 85 : city === "Laval" ? 22 : 5,
        totalDeals: city === "Montreal" ? 450 : city === "Laval" ? 110 : 35,
        totalRevenue: city === "Montreal" ? 12500 : city === "Laval" ? 3200 : 850,
        readinessScore: city === "Montreal" ? 100 : city === "Laval" ? 68 : 25,
        isReadyForExpansion: city === "Montreal" ? true : false,
        province: CITIES[city]?.province || "QC",
        focus: city === "Montreal" ? "DOMINATION" : city === "Laval" ? "EXPANSION" : "SEEDING"
      }));
      setMarkets(mockStats);
    } catch (error) {
      console.error("Failed to fetch market stats", error);
    } finally {
      setLoading(false);
    }
  };

  const currentMarket = markets.find(m => m.cityName === activeMarket) || markets[0];

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <Badge variant="gold" className="text-[8px] tracking-[0.3em] px-3 mb-2">STRATEGIC EXPANSION</Badge>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Market Domination</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Montréal → Québec → Canada</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Ops: ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Market List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-2">Active Markets</h2>
            <div className="space-y-2">
              {markets.map((market) => (
                <button
                  key={market.cityName}
                  onClick={() => setActiveMarket(market.cityName)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all ${
                    activeMarket === market.cityName 
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white" 
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black uppercase tracking-tight">{market.cityName}</span>
                    {CITIES[market.cityName]?.isPrimaryMarket && <Flag className="w-3 h-3 text-[#D4AF37]" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold opacity-60">{market.focus}</span>
                    <span className="text-[10px] font-black">{market.readinessScore}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button variant="ghost" className="w-full h-14 border border-dashed border-white/10 text-zinc-600 font-black text-[10px] tracking-widest uppercase hover:text-white hover:border-white/20 rounded-3xl">
            <MapPin className="w-4 h-4 mr-2" />
            Add New City
          </Button>
        </div>

        {/* Right: Detailed Analysis */}
        <div className="lg:col-span-3 space-y-8">
          {currentMarket && (
            <>
              {/* Market Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-white/5 rounded-3xl">
                  <CardContent className="p-6">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-white">${currentMarket.totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-green-500 text-[9px] font-bold mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +12.5% vs LW
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-3xl">
                  <CardContent className="p-6">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Brokers</p>
                    <p className="text-2xl font-black text-white">{currentMarket.activeBrokers}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">/ {currentMarket.totalBrokers} Total</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-3xl">
                  <CardContent className="p-6">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Market Deals</p>
                    <p className="text-2xl font-black text-[#D4AF37]">{currentMarket.totalDeals}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Confirmed In-App</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-3xl">
                  <CardContent className="p-6">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Readiness</p>
                    <p className="text-2xl font-black text-blue-400">{currentMarket.readinessScore}%</p>
                    <div className="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full" style={{ width: `${currentMarket.readinessScore}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategic Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-zinc-900/80 border-[#D4AF37]/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  
                  <div className="relative space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#D4AF37]" />
                        City Strategy: {currentMarket.focus}
                      </h3>
                      <Badge variant="gold">{currentMarket.cityName}</Badge>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Growth Plan</p>
                        <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                          {currentMarket.cityName === "Montreal" 
                            ? "Optimize pricing for maximum LTV and launch local broker referral network to cement leadership." 
                            : "Gather initial broker feedback and run small-scale lead gen ads to identify early adopters."}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Acquisition Plan</p>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                          {currentMarket.cityName === "Montreal"
                            ? "Aggressive Instagram/LinkedIn outreach targeting top-tier agencies."
                            : "Passive sourcing and early-adopter special offers ($49 leads)."}
                        </p>
                      </div>

                      <div className="pt-4 flex gap-2">
                        <Button variant="goldPrimary" className="text-[9px] font-black tracking-widest h-9 px-6 rounded-xl">
                          EXECUTE PHASE
                          <Zap className="w-3 h-3 ml-2" />
                        </Button>
                        <Button variant="ghost" className="text-[9px] font-black tracking-widest h-9 px-6 bg-white/5 border border-white/10 rounded-xl">
                          VIEW LOCAL LEADS
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Market Health Signals</h3>
                    <div className="space-y-3">
                      {[
                        { label: "OACIQ Alignment", value: "95%", status: "OPTIMIZED", color: "text-green-500" },
                        { label: "Pricing Sensitivity", value: "Medium", status: "STABLE", color: "text-blue-400" },
                        { label: "Network Effect", value: "3.2x", status: "STRONG", color: "text-purple-400" },
                        { label: "Expansion Risk", value: "Low", status: "SAFE", color: "text-zinc-500" }
                      ].map((signal, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center">
                              <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-white">{signal.label}</p>
                              <p className="text-[8px] text-zinc-600 font-bold uppercase">{signal.status}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-black ${signal.color}`}>{signal.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Operator Note</p>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        {currentMarket.isReadyForExpansion 
                          ? `Market ${currentMarket.cityName} has hit all dominance targets. Regional expansion to adjacent cities (Laval/Longueuil) is authorized.`
                          : `Currently seeding ${currentMarket.cityName}. Prioritize broker feedback over volume until activation rate hits 30%.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
